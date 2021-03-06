const config = require("./config.json");
const mysql = require("mysql");
const e = require("express");

const connection = mysql.createConnection({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
});
connection.connect();

/**
 * Get the abbreviations of the states and their names
 * Route: /states
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: None
 * Route Handler: states(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of {state (string), name (string)})}
 * Expected (Output) Behaviour:
 * - Example: /states
 */
async function states(req, res) {
  connection.query(
    `
    SELECT abbreviation AS state, name
    FROM State 
    `,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

/**
 * Get all stocks (in S&P500) in a given period
 * Route: /stocks
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: None
 * Route Handler: stocks(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of {code (string), name (string), industry (string), volatility (float),
 * min_price (float), max_price (float), min_volume (float), max_volume (float), r_with_new_case (float)})}
 * Expected (Output) Behaviour:
 * - Example: /stocks
 */
async function stocks(req, res) {
  connection.query(
    `
    WITH NewCase AS (
      SELECT submission_date, SUM(new_case) AS new_case
      FROM Day
      WHERE new_case >= 0
      GROUP BY submission_date
    ), Trend AS (
        SELECT S.date AS date, S.code AS code, S.close AS close, S.volume AS volume, N.new_case AS new_case
        FROM Stock S JOIN NewCase N ON S.date = N.submission_date
    ), AvgVals AS (
        SELECT T.code AS code, AVG(T.close) AS avg_close, AVG(T.volume) AS avg_volume, AVG(T.new_case) AS avg_case
        FROM Trend T
        GROUP BY T.code
    ), Corr AS (
        SELECT T.code AS code,
              SUM((T.close - A.avg_close) * (T.new_case - A.avg_case))
                  / (SQRT(SUM(POWER(T.close - A.avg_close, 2))) * SQRT(SUM(POWER(T.new_case - A.avg_case, 2)))) AS r
        FROM Trend T JOIN AvgVals A ON T.code = A.code
        GROUP BY T.code
    )
    SELECT S.code AS code, C.name AS name, C.GICS AS industry,
    CAST((MAX(S.close) - MIN(S.close)) / MIN(S.close) AS decimal(5, 3)) AS volatility,
    MIN(S.close) AS min_price, MAX(S.close) AS max_price,
    MIN(S.volume) AS min_volume, MAX(S.volume) AS max_volume,
    CAST(MAX(Corr.r) AS decimal(4, 3)) AS r_with_new_case
    FROM Stock S 
        JOIN Company C 
          on S.code = C.code
        JOIN Corr
          on S.code = Corr.code
    GROUP BY S.code
    `,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

/**
 * Get all the unique industries
 * Route: /industries
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: None
 * Route Handler: industries(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of {industry (string)})}
 * Expected (Output) Behaviour:
 * - Example: /industries
 *
 */
async function industries(req, res) {
  connection.query(
    `
    SELECT DISTINCT GICS AS industry
    FROM Company
    `,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

/**
 * Get the stocks with user-selected attributes
 * Route: /search/stocks
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: start (Date) (default: 2020-03-01), end (Date) (default: 2020-12-31),
 * code (string), state (string), industry (string), threshold (float), corr (float)
 * - threshold: used to threshold the stock volatility (stock's volatility >= threshold is considered high)
 * - corr: used to threshold the correlation r between the stock and number of new case (r >= corr is included)
 * Route Handler: search_stocks(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of {code (string), name (string), industry (string), volatility (float),
 * min_price (float), max_price (float), min_volume (float), max_volume (float), r_with_new_case (float)})}
 * Expected (Output) Behaviour:
 * - Example: /search/stocks or /search/stocks?start=2020-05-01&end=2020-12-31&code=AAPL
 * - Example: /search/stocks?start=2020-05-01&end=2020-12-31&state=CA
 * - Example: /search/stocks?start=2020-05-01&end=2020-12-31&state=CA&industry=Info
 * - Example: /search/stocks?start=2020-05-01&end=2020-12-31&threshold=1.0
 * - Example: /search/stocks?start=2020-05-01&end=2020-12-31&corr=0.7
 */
async function search_stocks(req, res) {
  // build up where clause for start, end, code, state, industry, threshold
  let clause = [];
  const filters = {
    start: ["S.date", ">="],
    end: ["S.date", "<="],
    code: ["S.code", "LIKE"],
    state: ["C.state", "LIKE"],
    industry: ["C.GICS", "LIKE"],
    corr: ["Corr.r", ">="],
  };
  for (const [attr, predicate] of Object.entries(filters)) {
    if (eval("req.query." + attr) && eval("req.query." + attr) != "null") {
      const value = eval("req.query." + attr);
      if (predicate[1] == "LIKE") {
        clause.push(`${predicate[0]} ${predicate[1]} '%${value}%'`);
      } else {
        clause.push(`${predicate[0]} ${predicate[1]} '${value}'`);
      }
    }
  }

  let where_clause = ``;
  if (clause.length > 0) {
    where_clause = `WHERE ${clause.join(" AND ")}`;
  }
  // clause for Volatility (use HAVING)
  let have_clause = ``;
  if (req.query.threshold && req.query.threshold != "null") {
    have_clause = `HAVING ((MAX(S.close) - MIN(S.close)) / MIN(S.close)) >= '${req.query.threshold}'`;
  }
  // subquery - where clause for correlation
  let corr_where_clause = ``;
  let corr_periods = [];
  for (const [attr, predicate] of Object.entries({
    start: ["S.date", ">="],
    end: ["S.date", "<="],
  })) {
    if (eval("req.query." + attr) && eval("req.query." + attr) != "null") {
      const value = eval("req.query." + attr);
      corr_periods.push(`${predicate[0]} ${predicate[1]} '${value}'`);
    }
  }
  if (corr_periods.length > 0) {
    corr_where_clause = `WHERE ${corr_periods.join(" AND ")}`;
  }
  // run query
  connection.query(
    `
    WITH NewCase AS (
      SELECT submission_date, SUM(new_case) AS new_case
      FROM Day
      WHERE new_case >= 0
      GROUP BY submission_date
    ), Trend AS (
        SELECT S.date AS date, S.code AS code, S.close AS close, S.volume AS volume, N.new_case AS new_case
        FROM Stock S JOIN NewCase N ON S.date = N.submission_date ` +
      corr_where_clause +
      ` ` +
      `
    ), AvgVals AS (
        SELECT T.code AS code, AVG(T.close) AS avg_close, AVG(T.volume) AS avg_volume, AVG(T.new_case) AS avg_case
        FROM Trend T
        GROUP BY T.code
    ), Corr AS (
        SELECT T.code AS code,
              SUM((T.close - A.avg_close) * (T.new_case - A.avg_case))
                  / (SQRT(SUM(POWER(T.close - A.avg_close, 2))) * SQRT(SUM(POWER(T.new_case - A.avg_case, 2)))) AS r
        FROM Trend T JOIN AvgVals A ON T.code = A.code
        GROUP BY T.code
    )
    SELECT S.code AS code, C.name AS name, C.GICS AS industry,
    CAST((MAX(S.close) - MIN(S.close)) / MIN(S.close) AS decimal(5, 3)) AS volatility,
    MIN(S.close) AS min_price, MAX(S.close) AS max_price,
    MIN(S.volume) AS min_volume, MAX(S.volume) AS max_volume,
    CAST(MAX(Corr.r) AS decimal(4, 3)) AS r_with_new_case
    FROM Stock S 
      JOIN Company C 
        on S.code = C.code 
      JOIN Corr
        on S.code = Corr.code
    ` +
      where_clause +
      `GROUP BY S.code ` +
      have_clause,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
      }
    }
  );
}

/**
 * Get the daily price (close) of the selected stock and the number of new cases (total in all the states or where the headquarter of the company is)
 * Route: /case/stock
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: start (Date), end (Date), code (string)
 * Route Handler: case_and_stock(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of { date (Date), price (float), new_case (int)})}
 * Expected (Output) Behaviour:
 * - Example: /case/stock?start=2020-05-01&end=2020-12-31&code=AAPL
 */
async function case_and_stock(req, res) {
  // check query params
  const code = req.query.code;
  const start = req.query.start;
  const end = req.query.end;
  connection.query(
    `
    WITH NewCase AS (
      SELECT submission_date, SUM(new_case) AS new_case
      FROM Day
      WHERE new_case >= 0
      GROUP BY submission_date
    )
    SELECT DATE_FORMAT(N.submission_date, "%m-%d-%Y") AS date, S.close AS price, N.new_case AS new_case
    FROM NewCase N JOIN Stock S 
      ON N.submission_date = S.date
    WHERE N.submission_date >= '${start}'
        AND N.submission_date <= '${end}'
        AND S.code = '${code}'
    `,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
      }
    }
  );
}

/**
 * Get the industry with the highest number of volatile stocks of each state during the pandemic (or in a given period)
 * Route: /state/industry
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: start (Date) (default: 2020-03-01), end (Date) (default: 2020-12-31),
 * threshold (Float) (default: 0.5)
 * - The threshold here is used to threshold the stock volatility (stock's volatility >= threshold is considered high)
 * Route Handler: state_industry(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of {state (string), industry (string)})}
 * - Here, the state is the abbreviation of the state name and the industry is the GICS code in the table.
 * Expected (Output) Behaviour:
 * - Example /state/industry?start=2020-05-01&end=2020-12-31&threshold=1.0
 *    - Return [{state: "CA", industry: "information technology"}, {state: "NY", industry: "Consumer Discretionary"}]
 */
async function state_industry(req, res) {
  const start = req.query.start ? req.query.start : "2020-03-01";
  const end = req.query.end ? req.query.end : "2020-12-31";
  const threshold = req.query.threshold ? req.query.threshold : 0.5;
  connection.query(
    `
    WITH VolatileStock AS (
      SELECT S.code, C.GICS, C.state
      FROM Stock S LEFT JOIN Company C on S.code = C.code
      WHERE S.date BETWEEN '${start}' AND '${end}'
      GROUP BY S.code
      HAVING (MAX(S.close) - MIN(S.close)) / MIN(S.close) >= '${threshold}'
    ), VolatileGICS AS (
      SELECT VS.state AS state, VS.GICS AS GICS, COUNT(*) AS num
      FROM VolatileStock VS
      GROUP BY VS.state, VS.GICS
    )
    SELECT state, GICS AS industry
    FROM VolatileGICS VG
    WHERE VG.num >= ALL(SELECT VG2.num FROM VolatileGICS VG2 WHERE VG2.state = VG.state) 
        AND state IS NOT NULL
    `,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

/**
 * Get the avg volatility of all the stocks of each state
 * Route: /state/volatility
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: start (Date) end (Date)
 * Route Handler: state_volatility(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of {state (string), volatility (float)})}
 * - Here, the state is the abbreviation of the state name
 * Expected (Output) Behaviour:
 * - Example /state/volatility?start=2020-03-01&end=2020-12-31
 */
async function state_volatility(req, res) {
  const start = req.query.start;
  const end = req.query.end;
  connection.query(
    `
    WITH Volatility AS (
      SELECT code, (MAX(close) - MIN(close)) / MIN(close) AS volatility
      FROM Stock
      WHERE date >= '${start}' AND date <= '${end}'
      GROUP BY code
    )
    SELECT C.state, CAST(AVG(V.volatility) AS decimal(5, 3)) AS volatility
    FROM Volatility V JOIN Company C ON V.code = C.code
    WHERE C.state IS NOT NULL
    GROUP BY C.state;
    `,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
      }
    }
  );
}

/**
 * Get the total new case of each state over the state population in a given period
 * The ratio here is normalized such that the largest one among the states is 1
 * Route: /state/case/norm
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: start (Date) end (Date)
 * Route Handler: state_case_norm(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of {state (string), new_case (integer), norm_ratio (float)})}
 * - Here, the state is the abbreviation of the state name
 * - new_case: the total number of new cases of a state in a given period
 * - norm_ratio: the normalized ratio of the new cases over the state population (normalized by the max ratio among the states)
 * Expected (Output) Behaviour:
 * - Example /state/case/norm?start=2020-03-01&end=2020-12-31
 */
async function state_case_norm(req, res) {
  const start = req.query.start;
  const end = req.query.end;
  connection.query(
    `
    WITH StateCase AS (
      SELECT state, SUM(new_case) AS new_case
      FROM Day
      WHERE submission_date >= '${start}' AND submission_date <= '${end}' AND new_case >= 0
      GROUP BY state
    ), StateCaseRatio AS (
        SELECT C.state AS state, C.new_case AS new_case, (C.new_case / S.population) AS ratio
        FROM StateCase C LEFT JOIN State S
         ON C.state = S.abbreviation
    )
    SELECT state, new_case, ratio / (SELECT MAX(ratio) FROM StateCaseRatio) AS norm_ratio
    FROM StateCaseRatio;
    `,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
      }
    }
  );
}

/*
Route For Yelp
*/
var yelp_period;
/**
 * Get time range when initialize
 */
const getTime = () => {
  return new Promise((resolve) => {
    connection.query(
      `
    SELECT DATE_FORMAT(MIN(review_date), "%Y-%m-%d") AS start_date, DATE_FORMAT(MAX(review_date), "%Y-%m-%d") AS end_date
    FROM Review;
    `,
      function (error, results) {
        if (error) {
          console.log(error);
          resolve();
        } else if (results) {
          yelp_period = results;
          resolve();
        }
      }
    );
  });
};
getTime();

//Route5
/**
 * Get yelp review counts by state
 * @param startDate start date for calculate yelp review count
 * @param endDate end date for calculate yelp review count
 */
/*
Examples:
  http://localhost:8080/yelp
  http://localhost:8080/yelp?start=2020-03-01&end=2020-03-31
 */
async function yelp_map(req, res) {
  const startDate = req.query.start
    ? req.query.start
    : yelp_period[0].start_date;
  const endDate = req.query.end ? req.query.end : yelp_period[0].end_date;
  connection.query(
    `
    SELECT abbreviation AS state, IFNULL(SUM(review_count), 0) AS review_count
	FROM State s
	LEFT JOIN
	    (
		SELECT review_count, state, review_date
		FROM Review_BId_State
		WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
	    )sd
	ON s.abbreviation = sd.state
	GROUP BY abbreviation
	ORDER BY abbreviation;
	`,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

//Route 6
/**
 * Get all categories for filter
 */
/*
Examples:
  http://localhost:8080/yelp/categories
*/
async function yelp_categories(req, res) {
  connection.query(
    `
    SELECT *
    FROM Categories;`,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

//Route 7
/**
 * Get all state for filter
 */
/*
Examples:
  http://localhost:8080/yelp/state
*/
async function yelp_state(req, res) {
  connection.query(
    `
    SELECT DISTINCT state
    FROM Business
    ORDER BY state;`,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

//Route 8
/**
 * Get time range for filter
 */
/*
Examples:
  http://localhost:8080/yelp/time
*/
async function yelp_time(req, res) {
  if (!yelp_period) await getTime();
  res.json({ results: yelp_period });
}

//Route 9
//Yelp filter function
/**
 * Get yelp review counts by state
 * @param startDate filter by start date
 * @param endDate filter by end date
 * @param state filter by specific state
 * @param categories filter by specific categories
 */

/*
Examples:
  http://localhost:8080/yelp/filter
  http://localhost:8080/yelp/filter?state=FL
  http://localhost:8080/yelp/filter?categories=Apartments
  http://localhost:8080/yelp/filter?state=FL&categories=Apartments
  http://localhost:8080/yelp/filter?state=FL&categories=Apartments&start=2020-03-01&end=2020-03-31
*/
async function yelp_filter(req, res) {
  const startDate = req.query.start
    ? req.query.start
    : yelp_period[0].start_date;
  const endDate = req.query.end ? req.query.end : yelp_period[0].end_date;
  const state = req.query.state;
  const categories = req.query.categories;

  if (state && categories) {
    //state and categories is not null
    connection.query(
      `
      WITH match_categories AS
	(
	  SELECT business_id AS id
	  FROM Business_Categories
	  WHERE categories = '${categories}'
	), match_state AS
	(
	  SELECT b.id
	  FROM Business b JOIN match_categories mc
	  ON b.id = mc.id
	  WHERE state = '${state}'
	), covid_cases AS
	(
	  SELECT submission_date, SUM(new_case) AS new_case
	  FROM Day D
	  WHERE submission_date BETWEEN '${startDate}' AND '${endDate}'
	  AND state = '${state}'
	  GROUP BY submission_date
	), review_business AS
	(
	  SELECT AVG(stars) AS average_star, COUNT(r.id) AS review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date
	  FROM Review r JOIN
	  match_state b
	  ON r.business_id=b.id
	  WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
	  GROUP BY review_date
	)
	SELECT *
	FROM (
	     SELECT average_star, review_count, review_date, IFNULL(new_case, 0) AS new_case
	     FROM review_business rb LEFT JOIN covid_cases cc
	     ON cc.submission_date = rb.review_date
	 )a
	 UNION ALL
	(
	     SELECT IFNULL(average_star, 0) AS average_star, IFNULL(review_count, 0) AS review_count, submission_date AS review_date, new_case
	     FROM review_business rb RIGHT JOIN covid_cases cc
	     ON cc.submission_date = rb.review_date
	     WHERE rb.review_date IS NULL
	 )
	ORDER BY review_date;`,
      function (error, results, fields) {
        res.json({ results: results });
      }
    );
  } else if (state) {
    //state is not null
    connection.query(
      `
      WITH covid_cases AS
	(
	  SELECT submission_date, SUM(new_case) AS new_case
	  FROM Day D
	  WHERE submission_date BETWEEN '${startDate}' AND '${endDate}'
	  AND state = '${state}'
	  GROUP BY submission_date
	), review_business AS
	(
	    SELECT review_date, SUM(total_star) / SUM(review_count) AS average_star, SUM(review_count) AS review_count
	    FROM Review_BId_State
	    WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
	    AND state = '${state}'
	    GROUP BY review_date
	)
	SELECT *
	FROM (
	     SELECT average_star, review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date, IFNULL(new_case, 0) AS new_case
	     FROM review_business rb LEFT JOIN covid_cases cc
	     ON cc.submission_date = rb.review_date
	 )a
	 UNION ALL
	(
	     SELECT IFNULL(average_star, 0) AS average_star, IFNULL(review_count, 0) AS review_count, submission_date AS review_date, new_case
	     FROM review_business rb RIGHT JOIN covid_cases cc
	     ON cc.submission_date = rb.review_date
	     WHERE rb.review_date IS NULL
	 )
	ORDER BY review_date;

     `,
      function (error, results, fields) {
        res.json({ results: results });
      }
    );
  } else if (categories) {
    //categories is not null
    connection.query(
      `
      WITH match_categories AS
	(
	  SELECT business_id AS id
	  FROM Business_Categories
	  WHERE categories = '${categories}'
	), covid_cases AS
	(
	  SELECT submission_date, SUM(new_case) AS new_case
	  FROM Day D
	  WHERE submission_date BETWEEN '${startDate}' AND '${endDate}'
	  GROUP BY submission_date
	), review_business AS
	(
	  SELECT AVG(stars) AS average_star, COUNT(r.id) AS review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date
	  FROM Review r JOIN
	  match_categories b
	  ON r.business_id=b.id
	  WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
	  GROUP BY review_date
	)
	SELECT *
	FROM (
	     SELECT average_star, review_count, review_date, IFNULL(new_case, 0) AS new_case
	     FROM review_business rb LEFT JOIN covid_cases cc
	     ON cc.submission_date = rb.review_date
	 )a
	 UNION ALL
	(
	     SELECT IFNULL(average_star, 0) AS average_star, IFNULL(review_count, 0) AS review_count, submission_date AS review_date, new_case
	     FROM review_business rb RIGHT JOIN covid_cases cc
	     ON cc.submission_date = rb.review_date
	     WHERE rb.review_date IS NULL
	 )
	ORDER BY review_date;
     `,
      function (error, results, fields) {
        res.json({ results: results });
      }
    );
  } else {
    //both state and categories is null
    connection.query(
      `
      WITH covid_cases AS
	(
	  SELECT submission_date, SUM(new_case) AS new_case
	  FROM Day D
	  WHERE D.submission_date BETWEEN '${startDate}' AND '${endDate}'
	  GROUP BY submission_date
	),
	review_count AS
	(
	    SELECT review_date, SUM(total_star) / SUM(review_count) AS average_star, SUM(review_count) AS review_count
	    FROM Review_BId_State
	    WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
	    GROUP BY review_date
	)
	SELECT *
	FROM (
	     SELECT IFNULL(average_star, 0) AS average_star, IFNULL(review_count, 0) AS review_count, submission_date AS review_date, new_case
	     FROM covid_cases D LEFT Join review_count r
	     ON D.submission_date = r.review_date
	 )a
	UNION ALL
	(
	    SELECT average_star, review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date, IFNULL(D.new_case, 0) AS new_case
	    FROM covid_cases D RIGHT Join review_count r
	    ON D.submission_date = r.review_date
	    WHERE D.submission_date IS NULL
	)
	ORDER BY review_date;
     `,
      function (error, results, fields) {
        res.json({ results: results });
      }
    );
  }
}

/**
 * Route 10
 * Get the number of wins for each party for each state over a year range
 * @param minyear = low end of year range to consider (default=2020)
 * @param maxyear = high end of range to consider (default=2020)
 * */
async function elections(req, res) {
  const minyear = req.query.minyear ? req.query.minyear : 2020;
  const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
  query = `SELECT party_detailed, state_abbreviation, COUNT(*) AS num_elections_won 
    FROM Elections
    WHERE year >= ${minyear} and year <= ${maxyear} AND won=1
    GROUP BY party_detailed, state_abbreviation`;
  //make the query and log the results
  connection.query(query, function (error, results, fields) {
    if (error) {
      console.log(error);
      res.json({ error: error });
    } else if (results) {
      res.json({ results: results });
    }
  });
}

/**
 * Route 11
 * Get the number of elections for which a given party has gotten the most and least votes
 * @param minyear the low end of the range of years to consider (default = beginning of data)
 * @param maxyear the high end of the range of years to consider (default = 2020)
 * @param state the user can optionally limit the results to a single state
 * @param limit the user can optionally only view the top n results
 * */
async function elections_fewest(req, res) {
  //get the parameters, using defaults where not specified
  const minyear = req.query.minyear ? req.query.minyear : 1976;
  const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
  const limit = req.query.limit ? req.query.limit : 0;
  const state = req.query.state;
  //first portion of the query
  query = `WITH least_votes AS (SELECT party_detailed, COUNT(*) AS least_elections
    FROM Elections E1
    WHERE `;
  //user can choose to only consider one state, which we can insert into the query here
  if (state) {
    query = query + ` state_abbreviation = "${state}" AND `;
  }
  // second part of the query
  query =
    query +
    `year >= ${minyear} AND year <= ${maxyear} AND stage = "gen" AND percent_votes <= ALL(
        SELECT percent_votes
        FROM Elections E2 
        WHERE E2.year = E1.year AND E2.state_abbreviation = E1.state_abbreviation
    )
    GROUP BY party_detailed
    ORDER BY least_elections DESC`;
  // user can only select the top n if they choose
  if (limit > 0) {
    query = query + ` LIMIT ${limit}`;
  }
  // now, join with information about the number of elections each party won
  query =
    query +
    `), 
  most_votes AS (SELECT party_detailed, COUNT(*) AS most_elections 
    FROM won_general_elections
    WHERE year >= ${minyear} AND year <= ${maxyear} `;
  if (state) {
    query = query + ` AND state_abbreviation = "${state}"`;
  }
  // do a full join so that we have information for parties that win no elections or lose no elections
  query =
    query +
    `GROUP BY party_detailed)
  SELECT L.party_detailed, IFNULL(M.most_elections,0) AS most_elections, L.least_elections
  FROM least_votes L LEFT JOIN most_votes M on L.party_detailed = M.party_detailed 
  UNION
  SELECT M.party_detailed, M.most_elections, IFNULL(L.least_elections, 0) AS least_elections
  FROM most_votes M LEFT  JOIN least_votes L on  M.party_detailed = L.party_detailed`;

  //make the query and log the results
  connection.query(query, function (error, results, fields) {
    if (error) {
      console.log(error);
      res.json({ error: error });
    } else if (results) {
      res.json({ results: results });
    }
  });
}

/**
 * Route 12
 * Which states sent the most candidates of party X to the senate between years A and B?
 * @param minyear the low end of the range of years to consider (default = beginning of data)
 * @param maxyear the high end of the range of years to consider (default = 2020)
 * @param party the party that we want to consider (default = Democrat)
 * */
async function elections_most_party(req, res) {
  const minyear = req.query.minyear ? req.query.minyear : 1976;
  const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
  const party = req.query.party;
  query = `WITH total_wins AS (
    SELECT state_abbreviation, name, COUNT(*) AS total_wins
    FROM won_general_elections
    WHERE year >= ${minyear} AND year <= ${maxyear}
    GROUP BY state_abbreviation
), specific_having AS (
    SELECT state_abbreviation, name, COUNT(*) AS specific_wins
    FROM won_general_elections
    WHERE year >= ${minyear} AND year <= ${maxyear}  AND party_detailed = "${party}"
    GROUP BY  state_abbreviation, name
)
SELECT T.state_abbreviation, T.name, IFNULL(specific_wins, 0) AS num_candidates, IFNULL(specific_wins, 0) * 100 / total_wins AS percent_vote
FROM total_wins T LEFT OUTER JOIN specific_having S ON T.state_abbreviation = S.state_abbreviation
ORDER BY num_candidates DESC`;
  //make the query and log the results
  connection.query(query, function (error, results, fields) {
    if (error) {
      console.log(error);
      res.json({ error: error });
    } else if (results) {
      res.json({ results: results });
    }
  });
}

/**
 * Route 13
 * Return the counts of candidates sent to the senate by the most and least populous states
 * @param minyear the low end of the range of years to consider (default = beginning of data)
 * @param maxyear the high end of the range of years to consider (default = 2020)
 * @param limit the number of high and low population states to consider (default = 5)
 * */
async function elections_populous(req, res) {
  //get the parameters, using defaults where not specified
  const minyear = req.query.minyear ? req.query.minyear : 1976;
  const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
  const limit = req.query.limit ? req.query.limit : 5;
  // write out the query
  query = `WITH most_populous_states AS (
        SELECT abbreviation
        FROM State
        ORDER BY population DESC
        LIMIT ${limit}
    ),
    least_populous_states AS (
        SELECT abbreviation
        FROM State
        ORDER BY population
        LIMIT ${limit}
    )
    SELECT party_detailed, COUNT(*) AS count, "Most Populous" AS type
        FROM most_populous_states M JOIN won_general_elections E on M.abbreviation = E.state_abbreviation
        WHERE E.year >= ${minyear} AND E.year <= ${maxyear}
        GROUP BY party_detailed
    UNION
    SELECT party_detailed, COUNT(*) AS count, "Least Populous" AS type
        FROM least_populous_states M JOIN won_general_elections E on M.abbreviation = E.state_abbreviation
        WHERE  E.year >= ${minyear} AND E.year <= ${maxyear}
        GROUP BY party_detailed
    `;
  //execute the query and return the results
  connection.query(query, function (error, results, fields) {
    if (error) {
      console.log(error);
      res.json({ error: error });
    } else if (results) {
      res.json({ results: results });
    }
  });
}

/**Route 14
 * Are more companies in blue or red states in a given year? This considers this question between two year endpoints
 * @param minyear the low end of the range of years to consider (default = beginning of data)
 * @param maxyear the high end of the range of years to consider (default = 2020)*/
async function company_political(req, res) {
  //get the user parameters
  const minyear = req.query.minyear ? req.query.minyear : 1976;
  const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
  // write the query
  query = `SELECT E.party_detailed, COUNT(DISTINCT C.name) AS num_companies, E.year AS year
    FROM Company C JOIN won_general_elections E on C.state = E.state_abbreviation
    WHERE E. year >= ${minyear} AND E.year <= ${maxyear}
    GROUP BY E.party_detailed, E.year`;
  //execute the query and return the results
  connection.query(query, function (error, results, fields) {
    if (error) {
      console.log(error);
      res.json({ error: error });
    } else if (results) {
      res.json({ results: results });
    }
  });
}

// ** COVID ROUTES **

/*
Examples:
  http://localhost:8080/covid/gen
*/
async function covid_gen(req, res) {
  connection.query(
    `SELECT
      sum(conf_cases) AS 'Total Confirmed Cases (to-date)',
      Round(avg(conf_cases),-1) AS 'Average Confirmed Cases per day',
      sum(conf_death) AS 'Total Confirmed Deaths (to-date)',
      Round(avg(conf_death),-1) AS 'Average Confirmed Deaths, per day '
    FROM Day`,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}


/*
Examples:
  http://localhost:8080/covid/season?state=CA
  http://localhost:8080/covid/season?state=NM

*/
async function covid_season(req, res) {
  const state = req.query.state;
  connection.query(
    `(SELECT SUM(tot_cases) as 'cases', 'Spring' as season, '2021' as year
      FROM Day
      WHERE (submission_date LIKE (submission_date LIKE '2021-03%')
      OR (submission_date LIKE '2021-04%')
      OR (submission_date LIKE '2021-05%'))
      AND (state = '${state}')
      GROUP BY state)
      UNION
      (SELECT SUM(tot_cases) as 'cases', 'Spring' as season, '2020' as year
      FROM Day
      WHERE (submission_date LIKE (submission_date LIKE '2021-03%')
      OR (submission_date LIKE '2020-04%')
      OR (submission_date LIKE '2020-05%'))
      AND (state = '${state}')
      GROUP BY state)
      UNION
      (SELECT SUM(tot_cases) as 'cases', 'Summer' as season, '2020' as year
      FROM Day
      WHERE (submission_date LIKE (submission_date LIKE '2020-06%')
      OR (submission_date LIKE '2020-07%')
      OR (submission_date LIKE '2020-08%'))
      AND (state = '${state}')
      GROUP BY state)
      UNION
      (SELECT SUM(tot_cases) as 'cases','Summer' as season, '2021' as year
      FROM Day
      WHERE (submission_date LIKE (submission_date LIKE '2021-06%')
      OR (submission_date LIKE '2021-07%')
      OR (submission_date LIKE '2021-08%'))
      AND (state = '${state}')
      GROUP BY state)
      UNION
     (SELECT SUM(tot_cases) as 'cases', 'Fall' as season, '2021' as year
      FROM Day
      WHERE (submission_date LIKE (submission_date LIKE '2021-09%')
      OR (submission_date LIKE '2021-10%')
      OR (submission_date LIKE '2021-11%'))
      AND (state = '${state}')
      GROUP BY state)
      UNION
      (SELECT SUM(tot_cases) as 'cases', 'Fall' as season, '2020' as year
      FROM Day
      WHERE (submission_date LIKE (submission_date LIKE '2021-09%')
      OR (submission_date LIKE '2020-10%')
      OR (submission_date LIKE '2020-11%'))
      AND (state = '${state}')
      GROUP BY state)`,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}


/*
Examples:
  http://localhost:8080/covid/comparison?start=2020-03-01&end=2020-03-31
  http://localhost:8080/covid/comparison?start=2020-03-01&end=2020-03-31&state=NM/
*/
async function covid_filter(req, res) {
  const end = req.query.end;
  const start = req.query.start;
  const state = req.query.state;
  if (state) {
    connection.query(
      `SELECT
      state,
      sum(tot_cases) AS 'conf_cases',
      Round(avg(tot_cases),-1) AS 'avg_conf_cases',
      sum(prob_cases) AS 'tot_prob_cases',
      Round(avg(prob_cases),-1) AS 'avg_prob_cases',
      sum(conf_death) AS 'tot_death',
      Round(avg(conf_death),-1) AS 'avg_death'
      FROM Day
      WHERE submission_date BETWEEN '${start}' AND '${end}' AND state = '${state}'
      GROUP BY state`,
      function (error, results, fields) {
        res.json({ results: results });
      }
    );
  } else {
    connection.query(
      `SELECT
      state,
      sum(tot_cases) AS 'conf_cases',
      Round(avg(tot_cases),-1) AS 'avg_conf_cases',
      sum(prob_cases) AS 'tot_prob_cases',
      Round(avg(prob_cases),-1) AS 'avg_prob_cases',
      sum(conf_death) AS 'tot_death',
      Round(avg(conf_death),-1) AS 'avg_death'
      FROM Day
      WHERE submission_date BETWEEN '${start}' AND '${end}'
      GROUP BY state`,
      function (error, results, fields) {
        res.json({ results: results });
      }
    );
  }
}

/**
 * Get the daily amount of vaccination given and the number of new cases
 * Route: /case/stock
 * Route Parameter(s) @param: None
 * Query Parameter(s) @param: start (Date), end (Date), code (string), state (string)
 * Route Handler: case_and_stock(req, res)
 * Return Type: JSON
 * Return Parameters:
 * {results (JSON array of { date (Date), price (float), new_case (int)})}
 * Expected (Output) Behaviour:
 * - Example: /case/stock?start=2020-05-01&end=2020-12-31&code=AAPL
 */
async function case_and_vax(req, res) {
  // check query params
  const state = req.query.state;
  const start = req.query.start;
  const end = req.query.end;

  connection.query(
    `WITH NewCase AS (
        SELECT state, submission_date, SUM(new_case) AS new_case
        FROM Day
        WHERE new_case >= 0 AND state = '${state}'
        GROUP BY submission_date
      )
      SELECT N.state,  DATE_FORMAT(N.submission_date, "%m-%d-%Y") AS date, V.Administered_Daily AS vaxs, N.new_case AS new_case
      FROM NewCase N JOIN Vaccination V ON  (N.submission_date = V.Date AND V.Location = N.state)
      WHERE N.submission_date BETWEEN '${start}'AND '${end}'
      AND V.Date BETWEEN '${start}'AND '${end}'`,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

async function case_and_vax_culm(req, res) {
  // check query params
  const state = req.query.state;
  const start = req.query.start;
  const end = req.query.end;

  connection.query(
    `WITH NewCase AS (
          SELECT state, submission_date, SUM(new_case) AS new_case
          FROM Day
          WHERE new_case >= 0 AND state = '${state}'
          GROUP BY submission_date
        )
        SELECT N.state,  DATE_FORMAT(N.submission_date, "%m-%d-%Y") AS date, V.Administered_Cumulative AS vaxs, N.new_case AS new_case
        FROM NewCase N JOIN Vaccination V ON  (N.submission_date = V.Date AND V.Location = N.state)
        WHERE N.submission_date BETWEEN '${start}'AND '${end}'
        AND V.Date BETWEEN '${start}'AND '${end}'
        AND date_type = 'Admin'`,
    function (error, results, fields) {
      res.json({ results: results });
    }
  );
}

async function state_and_vax(req, res) {
  // check query params
  const start = req.query.start;
  const end = req.query.end;
  connection.query(
    `
    WITH StateVac AS (
      SELECT Location, SUM(Administered_Daily) as num
      FROM Vaccination
      WHERE Date >= '${start}' AND Date <= '${end}' AND date_type = 'Admin'
      GROUP BY Location
    ), StateVacRatio AS (
        SELECT V.Location as state, V.num as num, (V.num / S.population) as ratio
        FROM StateVac V LEFT JOIN State S
        ON V.Location = S.abbreviation
    )
    SELECT state, num as num_vaccinated, ratio / (SELECT MAX(ratio) from StateVacRatio) as norm_num_vaccinated
    FROM StateVacRatio
    `,
    function (error, results, fields) {
      if (error) {
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
      }
    }
  );
}

module.exports = {
  case_and_stock,
  states,
  industries,
  stocks,
  search_stocks,
  state_volatility,
  state_industry,
  state_case_norm,
  yelp_map,
  yelp_categories,
  yelp_state,
  yelp_time,
  yelp_filter,
  elections,
  elections_fewest,
  elections_most_party,
  elections_populous,
  company_political,
  covid_gen,
  covid_filter,
  covid_season,
  case_and_vax,
  state_and_vax,
  case_and_vax_culm,
};

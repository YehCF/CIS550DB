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

// hello world
async function hello(req, res) {
  res.send(
    `This is CIS450/550 Final Project (Group31) - Polls, Pandemics and Possibly More!`
  );
}

// specific stock from start to end date
async function stock(req, res) {
  const code = req.query.code ? req.query.code : "AAPL";
  const startDate = req.query.start ? req.query.start : "2020-01-01";
  const endDate = req.query.end ? req.query.end : "2020-12-31";
  connection.query(
    `
    SELECT DATE_FORMAT(date, "%m-%d-%Y") as date, close
    FROM Stock S 
    WHERE S.code = '${code}' 
        AND S.date >= '${startDate}'
        AND S.date <= '${endDate}'
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

// popular stock
async function stock_popular(req, res) {
  const startDate = req.query.start ? req.query.start : "2020-01-01";
  const endDate = req.query.end ? req.query.end : "2020-12-31";
  const ratio = req.query.ratio ? req.query.ratio : 1;
  connection.query(
    `
    WITH Popular AS (
      SELECT S.code
      FROM Stock S
      WHERE S.date >= '${startDate}'
        AND S.date <= '${endDate}'
      GROUP BY S.code
      HAVING (MAX(S.close) - MIN(S.close)) / MIN(S.close) >= '${ratio}'
    )
    SELECT code, date, close
    FROM Stock S
    WHERE S.date >= '${startDate}'
      AND S.date <= '${endDate}'
      AND S.code in (SELECT * FROM Popular)
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

// state's close price
async function state_stock(req, res) {
  const startDate = req.query.start ? req.query.start : "2020-01-01";
  const endDate = req.query.end ? req.query.end : "2020-12-31";
  const GICS = req.query.GICS;
  if (GICS) {
    connection.query(
      `
      SELECT DATE_FORMAT(date, "%m-%d-%Y") AS date, C.state AS state, AVG(S.close) AS price
      FROM Stock S LEFT JOIN Company C 
        ON S.code = C.code
      WHERE S.date >= '${startDate}' AND S.date <= '${endDate}' AND C.GICS LIKE '%${GICS}%'
      GROUP BY S.date, C.state`,
      function (error, results, fields) {
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else if (results) {
          res.json({ results: results });
        }
      }
    );
  } else {
    connection.query(
      `
      SELECT DATE_FORMAT(date, "%m-%d-%Y") AS date, C.state AS state, AVG(S.close) AS price
      FROM Stock S LEFT JOIN Company C 
        ON S.code = C.code
      WHERE S.date >= '${startDate}' AND S.date <= '${endDate}'
      GROUP BY S.date, C.state`,
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
}

/*
Route For Yelp
*/
var yelp_period;
/**
 * Get time range when initialize
 */
const getTime = () => {
  connection.query(
    `
    SELECT DATE_FORMAT(MIN(review_date), "%Y-%m-%d") AS start_date, DATE_FORMAT(MAX(review_date), "%Y-%m-%d") AS end_date
    FROM Review;
    `,
    function (error, results) {
      if (error) {
        console.log(error);
      } else if (results) {
        // yelp_start_date = results[0].start_date;
        // console.log(yelp_start_date);
        // yelp_last_date = results[0].end_date;
        // console.log(yelp_last_date);
        yelp_period = results;
      }
    }
  );
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
    SELECT s.abbreviation AS state, IFNULL(review_count, 0) AS review_count
    FROM State s LEFT JOIN
    (
      SELECT state, COUNT(b.id) AS review_count
      FROM Business b JOIN
          (
              SELECT business_id
              FROM Review
              WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
          )rev
      ON b.id = rev.business_id
      GROUP BY state
    )rc
    ON s.abbreviation=rc.state`,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
        // console.log(Object.values(results).length);
      }
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
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
        // console.log(Object.values(results).length);
      }
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
    FROM Business;`,
    function (error, results, fields) {
      if (error) {
        console.log(error);
        res.json({ error: error });
      } else if (results) {
        res.json({ results: results });
        // console.log(Object.values(results).length);
      }
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
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else if (results) {
          res.json({ results: results });
          // console.log(Object.values(results).length);
          // console.log("both");
        }
      }
    );
  } else if (state) {
    //state is not null
    connection.query(
      `
      WITH match_state AS
	(
	  SELECT id
	  FROM Business
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
	  FROM Review r JOIN match_state b
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
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else if (results) {
          res.json({ results: results });
          // console.log(Object.values(results).length);
          // console.log("state");
        }
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
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else if (results) {
          res.json({ results: results });
          // Console.log(Object.values(results).length);
          // console.log("categories");
        }
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
	  SELECT AVG(stars) AS average_star, COUNT(r.id) AS review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date
	  FROM Review r
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
	    SELECT average_star, review_count, review_date, IFNULL(D.new_case, 0) AS new_case
	    FROM covid_cases D RIGHT Join review_count r
	    ON D.submission_date = r.review_date
	    WHERE D.submission_date IS NULL
	)
	ORDER BY review_date;
     `,
      function (error, results, fields) {
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else if (results) {
          res.json({ results: results });
          // console.log(Object.values(results).length);
          // console.log("null");
        }
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
async function elections(req, res){
    const minyear = req.query.minyear ? req.query.minyear : 2020;
    const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
    query = `SELECT party_detailed, state_abbreviation, COUNT(*) AS num_elections_won 
    FROM Elections
    WHERE year >= ${minyear} and year <= ${maxyear} AND won=1
    GROUP BY party_detailed, state_abbreviation`
    //make the query and log the results
    connection.query(query, function(error, results, fields){
        if (error) {
            console.log(error);
            res.json({ error: error });
        } else if (results) {
            res.json({ results: results });
        }
    })
}



/**
 * Route 11
 * Get the parties that most consistently get the fewest votes in an election
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
    query = `SELECT party_detailed, COUNT(*) AS num_elections
    FROM Elections E1
    WHERE `;
    //user can choose to only consider one state, which we can insert into the query here
    if (state){
        query = query + ` state_abbreviation = "${state}" AND `
    }
    // second part of the query
    query = query + `year >= ${minyear} AND year <= ${maxyear} AND percent_votes <= ALL(
        SELECT percent_votes
        FROM Elections E2 
        WHERE E2.year = E1.year AND E2.state_abbreviation = E1.state_abbreviation
    )
    GROUP BY party_detailed
    ORDER BY num_elections DESC`
    // user can only select the top n if they choose
    if (limit > 0){
        query = query + ` LIMIT ${limit}`
    }
    //make the query and log the results
    connection.query(query, function(error, results, fields){
        if (error) {
            console.log(error);
            res.json({ error: error });
        } else if (results) {
            res.json({ results: results });
        }
    })
}


/**
 * Route 12
 * Which states sent the most candidates of party X to the senate between years A and B?
 * @param minyear the low end of the range of years to consider (default = beginning of data)
 * @param maxyear the high end of the range of years to consider (default = 2020)
 * @param party the party that we want to consider (default = Democrat)
 * */
async function elections_most_party(req, res){
    //get the parameters from the user
    const minyear = req.query.minyear ? req.query.minyear : 1976;
    const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
    const party = req.query.party ? req.query.party : "DEMOCRAT";
    //define the query
    query = `
    WITH Temp AS(
        SELECT state_abbreviation, COUNT(*) AS num_candidates 
        FROM Elections 
        WHERE won=1 AND year >= ${minyear} AND year <= ${maxyear} AND stage = "gen" and party_detailed = "${party}"
        GROUP BY state_abbreviation
        UNION
        SELECT DISTINCT state_abbreviation, 0 AS num_candidates 
        FROM Elections E1 
        WHERE NOT EXISTS(
            SELECT * FROM Elections E2
            WHERE E1.state_abbreviation = E2.state_abbreviation 
            AND E2.year >= ${minyear} AND E2.year <= ${maxyear} AND E2.won = 1 AND E2.stage = "gen" and E2.party_detailed = "${party}" 
        )
    )
    SELECT S.abbreviation, S.name, T.num_candidates
    FROM Temp T JOIN State S ON T.state_abbreviation = S.abbreviation
    ORDER BY num_candidates DESC;
`
    //make the query and log the results
    connection.query(query, function(error, results, fields){
        if (error) {
            console.log(error);
            res.json({ error: error });
        } else if (results) {
            res.json({ results: results });
        }
    })
}


/**
 * Route 13
 * Return the counts of candidates sent to the senate by the most and least populous states
 * @param minyear the low end of the range of years to consider (default = beginning of data)
 * @param maxyear the high end of the range of years to consider (default = 2020)
 * @param limit the number of high and low population states to consider (default = 5)
 * */
async function elections_populous(req, res){
    //get the parameters, using defaults where not specified
    const minyear = req.query.minyear ? req.query.minyear : 1976;
    const maxyear = req.query.maxyear ? req.query.maxyear : 2020;
    const limit = req.query.limit ? req.query.limit : 5;
    // write out the query
    query = ` WITH most_populous_states AS (
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
    SELECT M.party_detailed, most_populous_count, least_populous_count 
    FROM (SELECT party_detailed, COUNT(*) AS most_populous_count
        FROM most_populous_states M JOIN Elections E on M.abbreviation = E.state_abbreviation
        WHERE E.won = 1 AND E.year >= ${minyear} and E.year <= ${maxyear}
        GROUP BY party_detailed) M
        LEFT OUTER JOIN (
        SELECT party_detailed, COUNT(*) AS least_populous_count 
        FROM least_populous_states M JOIN Elections E on M.abbreviation = E.state_abbreviation
        WHERE E.won = 1 AND E.year <= ${maxyear} AND E.year >= ${minyear}
        GROUP BY party_detailed) L
        ON M.party_detailed = L.party_detailed
    `
    //execute the query and return the results
    connection.query(query, function(error, results, fields){
        if (error) {
            console.log(error);
            res.json({ error: error });
        } else if (results) {
            res.json({ results: results });
        }
    })
}

/**Route 14
 * Are more companies in blue or red states in a given year?
 * @param : year in which to conduct the calculation*/
async function company_political(req, res) {
    //get the user parameters
    const year = req.query.year ? req.query.year : 2020;
    // write the query
    query = `SELECT E.party_detailed, COUNT(DISTINCT C.name) AS num_companies
        FROM Company C JOIN Elections E on C.state = E.state_abbreviation
        WHERE E.won = 1 AND E.year = ${year}
        GROUP BY E.party_detailed `;
    //execute the query and return the results
    connection.query(query, function(error, results, fields){
        if (error) {
            console.log(error);
            res.json({ error: error });
        } else if (results) {
            res.json({ results: results });
        }
    })
}

module.exports = {
  hello,
  stock,
  stock_popular,
  state_stock,
  yelp_map,
  yelp_categories,
  yelp_state,
  yelp_time,
  yelp_filter,
  elections,
  elections_fewest,
  elections_most_party,
  elections_populous,
  company_political
};

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
const getTime = () =>{
  connection.query(
    `
    SELECT DATE_FORMAT(MIN(review_date), "%Y-%m-%d") AS start_date, DATE_FORMAT(MAX(review_date), "%Y-%m-%d") AS end_date
    FROM Review;
    `,function (error, results) {
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
}
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
  const startDate = req.query.start ? req.query.start : yelp_period[0].start_date;
  const endDate = req.query.end ? req.query.end : yelp_period[0].end_date;
  connection.query(
    `
    SELECT s.abbreviation AS state, IFNULL(review_count, 0)
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
*/
async function yelp_filter(req, res) {
  const startDate = req.query.start ? req.query.start : yelp_period[0].start_date;
  const endDate = req.query.end ? req.query.end : yelp_period[0].end_date;
  const state = req.query.state;
  const categories = req.query.categories;

  if(state && categories){  //state and categories is not null
    connection.query(
      `
      WITH match_categories AS
      (
          SELECT bc.business_id AS id
          FROM(SELECT business_id
              FROM Business_Categories
              WHERE categories = '${categories}'
            ) bc
          JOIN Business b
          ON bc.business_id = b.id
          WHERE b.state = '${state}'
      )
      SELECT AVG(stars) AS average_star, COUNT(r.id) AS review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date
      FROM Review r JOIN
      match_categories b
      ON r.business_id=b.id
      WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY review_date
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
  }else if(state){          //state is not null
    connection.query(
      `
      SELECT AVG(stars) AS average_star, COUNT(r.id) AS review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date
      FROM Review r JOIN
          (
              SELECT id
              FROM Business
              WHERE state = '${state}'
          )b
      ON r.business_id=b.id
      WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY review_date
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
  }else if(categories){     //categories is not null
    connection.query(
      `
      WITH match_categories AS
      (
          SELECT business_id AS id
          FROM Business_Categories
          WHERE categories = '${categories}'
      )
      SELECT AVG(stars) AS average_star, COUNT(r.id) AS review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date
      FROM Review r JOIN
      match_categories b
      ON r.business_id=b.id
      WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY review_date
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
  }else{                    //both state and categories is null
    connection.query(
      `
      SELECT AVG(stars) AS average_star, COUNT(r.id) AS review_count, DATE_FORMAT(review_date, "%Y-%m-%d") AS review_date
      FROM Review r
      WHERE review_date BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY review_date
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
Examples:
  http://localhost:8080/covid?state=CA
  http://localhost:8080/covid?state=NM
  http://localhost:8080/covid?state=WA
*/
async function covid_state(req, res) {
  const state = req.query.state;

  if(!state) {
    // defaults to california
    connection.query(
      `SELECT
        sum(conf_cases) AS 'Total Confirmed Cases (to-date)',
        Round(avg(conf_cases),-1) AS 'Average Confirmed Cases per day',
        sum(conf_death) AS 'Total Confirmed Deaths (to-date)',
        Round(avg(conf_death),-1) AS 'Average Confirmed Deaths, per day '
        WHERE state = 'CA'
      FROM Day`,
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
      `SELECT
        sum(conf_cases) AS 'Total Confirmed Cases (to-date)',
        Round(avg(conf_cases),-1) AS 'Average Confirmed Cases per day',
        sum(conf_death) AS 'Total Confirmed Deaths (to-date)',
        Round(avg(conf_death),-1) AS 'Average Confirmed Deaths, per day '
        WHERE state = '${state}'
      FROM Day`,
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
Examples:
  http://localhost:8080/covid/season/
  http://localhost:8080/covid/season/fall
  http://localhost:8080/covid/season/summer
  http://localhost:8080/covid/gen/spring
*/
async function covid_season(req, res) {
  const season = req.query.season;
  // defaults to summer
  if(season == null || season == "summer") {
    connection.query(
      `WITH T1 AS (SELECT SUM(tot_cases) as 'SummerCases2020', state
      FROM Day
      WHERE submission_date LIKE (submission_date LIKE '2020-06%')
      OR (submission_date LIKE '2020-07%')
      OR (submission_date LIKE '2020-08%')
      GROUP BY state),
      T2 AS (SELECT SUM(tot_cases) as 'SummerCases2021', state
      FROM Day
      WHERE submission_date LIKE (submission_date LIKE '2021-06%')
      OR (submission_date LIKE '2021-07%')
      OR (submission_date LIKE '2021-08%')
      GROUP BY state)
      ,T3 AS (SELECT name, abbreviation FROM State)
      SELECT T3.name, SummerCases2020, SummerCases2021
      FROM (T1 JOIN T2 ON T1.state = T2.state JOIN T3 on T3.abbreviation = T2.state)
      ORDER BY SummerCases2020 DESC`,
      function (error, results, fields) {
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else if (results) {
          res.json({ results: results });
        }
      }
    );
  } else if(season == "spring") {
    connection.query(
      `WITH T1 AS (SELECT SUM(tot_cases) as 'SpringCases2020', state
      FROM Day
      WHERE submission_date LIKE (submission_date LIKE '2020-03%')
      OR (submission_date LIKE '2020-04%')
      OR (submission_date LIKE '2020-05%')
      GROUP BY state),
      T2 AS (SELECT SUM(tot_cases) as 'SpringCases2021', state
      FROM Day
      WHERE submission_date LIKE (submission_date LIKE '2021-03%')
      OR (submission_date LIKE '2021-04%')
      OR (submission_date LIKE '2021-05%')
      GROUP BY state)
      ,T3 AS (SELECT name, abbreviation FROM State)
      SELECT T3.name, SpringCases2020, SpringCases2021
      FROM (T1 JOIN T2 ON T1.state = T2.state JOIN T3 on T3.abbreviation = T2.state)
      ORDER BY SpringCases2020 DESC`,
      function (error, results, fields) {
        if (error) {
          console.log(error);
          res.json({ error: error });
        } else if (results) {
          res.json({ results: results });
        }
      }
    );
  } else if(season == "fall") {
    connection.query(
      `WITH T1 AS (SELECT SUM(tot_cases) as 'FallCases2020', state
      FROM Day
      WHERE submission_date LIKE (submission_date LIKE '2020-09%')
      OR (submission_date LIKE '2020-10%')
      OR (submission_date LIKE '2020-11%')
      GROUP BY state),
      T2 AS (SELECT SUM(tot_cases) as 'FallCases2021', state
      FROM Day
      WHERE submission_date LIKE (submission_date LIKE '2021-09%')
      OR (submission_date LIKE '2021-10%')
      OR (submission_date LIKE '2021-11%')
      GROUP BY state)
      ,T3 AS (SELECT name, abbreviation FROM State)
      SELECT T3.name, FallCases2020, FallCases2021
      FROM (T1 JOIN T2 ON T1.state = T2.state JOIN T3 on T3.abbreviation = T2.state)
      ORDER BY FallCases2020 DESC`,
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
Examples:
  http://localhost:8080/covid/covid_comparison?state1=NM&state2=CA
*/
async function covid_comparison(req, res) {
  const state1 = req.query.state1;
  const state2 = req.query.state2;
  connection.query(
    `SELECT
      state as State
      sum(conf_cases) AS 'Total Confirmed Cases (to-date)',
      Round(avg(conf_cases),-1) AS 'Average Confirmed Cases per day',
      sum(conf_death) AS 'Total Confirmed Deaths (to-date)',
      Round(avg(conf_death),-1) AS 'Average Confirmed Deaths, per day '
      WHERE state = '${state1}' OR  state = '${state2}'
    FROM Day`,
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
Examples:
  http://localhost:8080/covid/covid_comparison?start=2020-03-01&end=2020-03-31
*/
async function covid_filter(req, res) {
  const end = req.query.end;
  const start = req.query.start;
  connection.query(
    `SELECT
    sum(conf_cases) AS 'Total Confirmed Cases (to-date)',
    Round(avg(conf_cases),-1) AS 'Average Confirmed Cases per day',
    sum(conf_death) AS 'Total Confirmed Deaths (to-date)',
    Round(avg(conf_death),-1) AS 'Average Confirmed Deaths, per day '
    FROM Day
    WHERE submission_date BETWEEN ${start}' AND ${end}'`,
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
  



  




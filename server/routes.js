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

module.exports = {
  hello,
  stock,
  stock_popular,
  state_stock,
};

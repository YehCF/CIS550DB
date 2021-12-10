const { expect } = require("@jest/globals");
const supertest = require("supertest");
const { number } = require("yargs");
const yelp_results = require("./yelp_results.json");
const state_results = require("./state_results.json");
const stock_results = require("./stock_results.json");
const election_results = require("./election_results.json");
const covid_results = require("./covid_results.json");
const app = require("../server");

// **********************************
//        Yelp Route: Time
// **********************************

test("GET /yelp/time", async () => {
  await supertest(app)
    .get("/yelp/time")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(yelp_results.yelp_time);
    });
}, 50000);

// **********************************
//         Yelp Route: Map
// **********************************
test("GET /yelp no parameters", async () => {
  await supertest(app)
    .get("/yelp")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(yelp_results.yelp_state);
    });
});

test("GET /yelp with time", async () => {
  await supertest(app)
    .get("/yelp?start=2020-03-01&end=2020-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(yelp_results.yelp_state_time);
    });
});

// **********************************
//        Yelp Route: All Categories
// **********************************

test("GET /yelp/categories", async () => {
  await supertest(app)
    .get("/yelp/categories")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(1330);
    });
});

// **********************************
//        Yelp Route: All State
// **********************************

test("GET /yelp/state", async () => {
  await supertest(app)
    .get("/yelp/state")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(31);
    });
});

// **********************************
//       Yelp Filter TESTS
// **********************************

//no selected
test("GET /yelp/filter nothing", async () => {
  await supertest(app)
    .get("/yelp/filter")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(759);
    });
});

//state
test("GET /yelp/filter?state state 1", async () => {
  await supertest(app)
    .get("/yelp/filter?state=MA")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(759);
    });
});

test("GET /yelp/filter?state state 2", async () => {
  await supertest(app)
    .get("/yelp/filter?state=AK")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(373);
    });
});

//categories
test("GET /yelp/filter?categories categories 1", async () => {
  await supertest(app)
    .get("/yelp/filter?categories=& Probates")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(759);
    });
});

test("GET /yelp/filter?categories 2", async () => {
  await supertest(app)
    .get("/yelp/filter?categories=3D Printing")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(380);
    });
});

//time only
test("GET /yelp/filter?start time start", async () => {
  await supertest(app)
    .get("/yelp/filter?start=2020-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(304);
    });
});

test("GET /yelp/filter?end time end", async () => {
  await supertest(app)
    .get("/yelp/filter?end=2020-03-01")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(426);
    });
});

test("GET /yelp/filter?start&end time start+end", async () => {
  await supertest(app)
    .get("/yelp/filter?start=2020-03-31&end=2020-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(1);
      expect(response.body.results).toStrictEqual(
        yelp_results.yelp_filter_time
      );
    });
});

//state + categories
test("GET /yelp/filter?state&categories state+categories 1", async () => {
  await supertest(app)
    .get("/yelp/filter?state=FL&categories=Apartments")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(717);
    });
});

test("GET /yelp/filter?state&categories state+categories 2", async () => {
  await supertest(app)
    .get("/yelp/filter?state=AK&categories=Restaurants")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(373);
    });
});

//state + time
test("GET /yelp/filter?state&start state+start", async () => {
  await supertest(app)
    .get("/yelp/filter?state=CA&start=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(394);
    });
});

test("GET /yelp/filter?state&end state+end", async () => {
  await supertest(app)
    .get("/yelp/filter?state=PA&end=2020-03-01")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(40);
    });
});

test("GET /yelp/filter?state&start&end state+start+end", async () => {
  await supertest(app)
    .get("/yelp/filter?state=MA&start=2019-03-01&end=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(31);
    });
});

//categories + time
test("GET /yelp/filter?categories&start categories+start", async () => {
  await supertest(app)
    .get("/yelp/filter?categories=Apartments&start=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(670);
    });
}, 30000);

test("GET /yelp/filter?categories&end categories+end", async () => {
  await supertest(app)
    .get("/yelp/filter?categories=Apartments&end=2019-03-01")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(60);
    });
});

test("GET /yelp/filter?categories&start&end categories+start+end", async () => {
  await supertest(app)
    .get("/yelp/filter?categories=Apartments&start=2019-03-01&end=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(31);
    });
});

//state + categories + time
test("GET /yelp/filter?state&categories&start&end categories+start+end 1", async () => {
  await supertest(app)
    .get(
      "/yelp/filter?state=MA&categories=Apartments&start=2019-03-01&end=2019-03-31"
    )
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(28);
      expect(response.body.results).toStrictEqual(yelp_results.yelp_filter_all);
    });
});

test("GET /yelp/filter?state&categories&start&end state+categories+start+end 2", async () => {
  await supertest(app)
    .get(
      "/yelp/filter?state=PA&categories=Restaurants&start=2019-03-01&end=2020-03-31"
    )
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(70);
    });
});

// **********************************
//       State Map
// **********************************

test("GET /states", async () => {
  await supertest(app)
    .get("/states")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(50);
      expect(response.body.results).toStrictEqual(state_results.states);
    });
});

test("GET /state/volatility with start & end date", async () => {
  await supertest(app)
    .get("/state/volatility?start=2020-03-01&end=2020-12-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(state_results.volatility);
    });
});

test("GET /state/volatility with wrong date format", async () => {
  await supertest(app)
    .get("/state/volatility?start=2020-03-01&end=2020-1w-3s")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toBe("ER_WRONG_VALUE");
    });
});

test("GET /state/case/norm with start & end date", async () => {
  await supertest(app)
    .get("/state/case/norm?start=2020-03-01&end=2020-12-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(state_results.case_num);
    });
});

test("GET /state/case/norm with wrong date format", async () => {
  await supertest(app)
    .get("/state/case/norm?start=2020-03-01&end=2020-12-as1")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toBe("ER_WRONG_VALUE");
    });
});

// **********************************
//       Stock
// **********************************

test("GET /stocks", async () => {
  await supertest(app)
    .get("/stocks")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(503);
    });
});

test("Get /industries", async () => {
  await supertest(app)
    .get("/industries")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(stock_results.industries);
    });
});

test("GET /search/stocks no query parameters", async () => {
  await supertest(app)
    .get("/search/stocks")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(503);
    });
});

test("GET /search/stocks with code, start date and end date", async () => {
  await supertest(app)
    .get("/search/stocks?start=2020-05-01&end=2020-12-31&code=AAPL")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(stock_results.aapl);
    });
});

test("GET /search/stocks with state, start & end date", async () => {
  await supertest(app)
    .get("/search/stocks?start=2020-05-01&end=2020-05-31&state=CA")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(73);
    });
});

test("GET /search/stocks with state, industry, start & end date", async () => {
  await supertest(app)
    .get(
      "/search/stocks?start=2020-05-01&end=2020-12-31&state=CA&industry=Info"
    )
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(29);
    });
});

test("GET /search/stocks with volatility threshold, start & end date", async () => {
  await supertest(app)
    .get("/search/stocks?start=2020-05-01&end=2020-12-31&threshold=0.75")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(133);
    });
});

test("GET /search/stocks with correlation, start & end date", async () => {
  await supertest(app)
    .get("/search/stocks?start=2020-05-01&end=2020-12-31&corr=0.7")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(253);
    });
});

test("GET /search/stocks with wrong date format", async () => {
  await supertest(app)
    .get("/search/stocks?start=2020-05-01&end=2020-1a-31&corr=0.7")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toBe("ER_WRONG_VALUE");
    });
});

test("GET /state/industry with volatility threshold, start & end date", async () => {
  await supertest(app)
    .get("/state/industry?start=2020-05-01&end=2020-12-31&threshold=1.0")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(30);
    });
});

test("GET /case/stock with start date, end date and code", async () => {
  await supertest(app)
    .get("/case/stock?start=2020-05-01&end=2020-12-31&code=AAPL")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(170);
    });
});

test("GET /case/stock with wrong date format", async () => {
  await supertest(app)
    .get("/case/stock?start=2020-05-a&end=2020-12-31&code=AAPL")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toBe("ER_WRONG_VALUE");
    });
});

// **********************************
//       Election
// **********************************

test("GET /elections with default", async () => {
  await supertest(app)
    .get("/elections")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(33);
    });
});

test("GET /elections with 2018 to 2020", async () => {
  await supertest(app)
    .get("/elections?minyear=2018&maxyear=2020")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(54);
    });
});

test("GET /elections with wrong year format", async () => {
  await supertest(app)
    .get("/elections?minyear=201a&maxyear=2020")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toEqual("ER_BAD_FIELD_ERROR");
    });
});

test("GET /elections/fewest with default", async () => {
  await supertest(app)
    .get("/elections/fewest")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(87);
    });
});

test("GET /elections/fewest with minyear, maxyear, state, limit", async () => {
  await supertest(app)
    .get("/elections/fewest?minyear=2018&maxyear=2020&limit=3&state=CA")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(election_results.fewest);
      expect(response.body.results.length).toEqual(1);
    });
});

test("GET /elections/fewest with wrong year format", async () => {
  await supertest(app)
    .get("/elections/fewest?minyear=201a&maxyear=2020&limit=3&state=CA")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toEqual("ER_BAD_FIELD_ERROR");
    });
});

test("GET /elections/party with default ", async () => {
  await supertest(app)
    .get("/elections/party")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(50);
    });
});

test("GET /elections/party with wrong year format", async () => {
  await supertest(app)
    .get("/elections/party?maxyear=2a")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toEqual("ER_BAD_FIELD_ERROR");
    });
});

test("GET /elections_populous with default", async () => {
  await supertest(app)
    .get("/elections/populous")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(election_results.populous);
    });
});

test("GET /elections_populous with wrong year format", async () => {
  await supertest(app)
    .get("/elections/populous?maxyear=a")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toEqual("ER_BAD_FIELD_ERROR");
    });
});

test("GET /elections/companies with default", async () => {
  await supertest(app)
    .get("/elections/companies")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(55);
    });
});

test("GET /elections/companies with wrong year format", async () => {
  await supertest(app)
    .get("/elections/companies?maxyear=a")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toEqual("ER_BAD_FIELD_ERROR");
    });
});

// **********************************
//       COVID
// **********************************

// // takes in two states, and produces data for
// app.get("/covid/comparison", routes.covid_comparison);

test("GET /covid", async () => {
  await supertest(app)
    .get("/covid")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(covid_results.covid);
    });
});

// test("GET /covid?state=CA", async () => {
//   await supertest(app)
//     .get("/covid?state=CA")
//     .expect(200)
//     .then((response) => {
//       expect(response.body.results).toStrictEqual(covid_results.ca);
//     });
// });

test("GET /covid/season with state", async () => {
  await supertest(app)
    .get("/covid/season?state=CA")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(covid_results.season);
    });
});

test("GET /covid/filter with start date, end date and state", async () => {
  await supertest(app)
    .get("/covid/filter?start=2021-01-01&end=2021-03-31&state=CA")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(covid_results.filter);
    });
});

test("GET /covid/filter with start date, end date", async () => {
  await supertest(app)
    .get("/covid/filter?start=2021-01-01&end=2021-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(50);
    });
});

test("GET /covid/vax with start date, end date and state", async () => {
  await supertest(app)
    .get("/covid/vax?start=2021-01-01&end=2021-04-30&state=NY")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(240);
    });
});

test("GET /covid/vax/culm with start date, end date and state", async () => {
  await supertest(app)
    .get("/covid/vax/culm?start=2021-01-01&end=2021-04-30&state=NY")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(120);
    });
});

test("GET /covid/vax/state with start date and end date", async () => {
  await supertest(app)
    .get("/covid/vax/state?start=2021-01-15&end=2021-06-30")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(50);
    });
});

test("GET /covid/vax/state with wrong date format", async () => {
  await supertest(app)
    .get("/covid/vax/state?start=2021-0a-15&end=2021-06-30")
    .expect(200)
    .then((response) => {
      expect(response.body.error.code).toBe("ER_WRONG_VALUE");
    });
});

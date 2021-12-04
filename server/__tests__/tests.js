const { expect } = require("@jest/globals");
const supertest = require("supertest");
const { number } = require("yargs");
const yelp_results = require("./yelp_results.json")
const app = require('../server');

// **********************************
//        Yelp Route: Time
// **********************************

test("GET /yelp/time", async () => {
  await supertest(app).get("/yelp/time")
    .expect(200)
    .then((response) => {
      expect(response.body.results).toStrictEqual(yelp_results.yelp_time)
    });
}, 50000);

// **********************************
//         Yelp Route: Map
// **********************************
test("GET /yelp no parameters", async () => {
    await supertest(app).get("/yelp")
      .expect(200)
      .then((response) => {
			expect(response.body.results).toStrictEqual(yelp_results.yelp_state)
      });
});

test("GET /yelp with time", async () => {
  
    await supertest(app).get("/yelp?start=2020-03-01&end=2020-03-31")
      .expect(200)
      .then((response) => {
			expect(response.body.results).toStrictEqual(yelp_results.yelp_state_time)
      });
});


// **********************************
//        Yelp Route: All Categories
// **********************************

test("GET /yelp/categories", async () => {
  await supertest(app).get("/yelp/categories")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(1330)
    });
});

// **********************************
//        Yelp Route: All State
// **********************************

test("GET /yelp/state", async () => {
  await supertest(app).get("/yelp/state")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(31)
    });
});

// **********************************
//       Yelp Filter TESTS
// **********************************

//no selected
test("GET /yelp/filter nothing", async () => {
  await supertest(app).get("/yelp/filter")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(759)
    });
});

//state 
test("GET /yelp/filter?state state 1", async () => {
  await supertest(app).get("/yelp/filter?state=MA")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(759)
    });
});

test("GET /yelp/filter?state state 2", async () => {
  await supertest(app).get("/yelp/filter?state=AK")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(373)
    });
});

//categories
test("GET /yelp/filter?categories categories 1", async () => {
  await supertest(app).get("/yelp/filter?categories=& Probates")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(759)
    });
});

test("GET /yelp/filter?categories 2", async () => {
  await supertest(app).get("/yelp/filter?categories=3D Printing")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(380)
    });
});

//time only
test("GET /yelp/filter?start time start", async () => {
  await supertest(app).get("/yelp/filter?start=2020-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(304)
    });
});

test("GET /yelp/filter?end time end", async () => {
  await supertest(app).get("/yelp/filter?end=2020-03-01")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(426)
    });
});

test("GET /yelp/filter?start&end time start+end", async () => {
  await supertest(app).get("/yelp/filter?start=2020-03-31&end=2020-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(1)
      expect(response.body.results).toStrictEqual(yelp_results.yelp_filter_time)
    });
});

//state + categories
test("GET /yelp/filter?state&categories state+categories 1", async () => {
  await supertest(app).get("/yelp/filter?state=FL&categories=Apartments")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(717)
    });
});

test("GET /yelp/filter?state&categories state+categories 2", async () => {
  await supertest(app).get("/yelp/filter?state=AK&categories=Restaurants")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(373)
    });
});

//state + time
test("GET /yelp/filter?state&start state+start", async () => {
  await supertest(app).get("/yelp/filter?state=CA&start=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(394)
    });
});

test("GET /yelp/filter?state&end state+end", async () => {
  await supertest(app).get("/yelp/filter?state=PA&end=2020-03-01")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(40)
    });
});

test("GET /yelp/filter?state&start&end state+start+end", async () => {
  await supertest(app).get("/yelp/filter?state=MA&start=2019-03-01&end=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(31)
    });
});

//categories + time
test("GET /yelp/filter?categories&start categories+start", async () => {
  await supertest(app).get("/yelp/filter?categories=Apartments&start=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(670)
    });
});

test("GET /yelp/filter?categories&end categories+end", async () => {
  await supertest(app).get("/yelp/filter?categories=Apartments&end=2019-03-01")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(60)
    });
});

test("GET /yelp/filter?categories&start&end categories+start+end", async () => {
  await supertest(app).get("/yelp/filter?categories=Apartments&start=2019-03-01&end=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(31)
    });
});

//state + categories + time 
test("GET /yelp/filter?state&categories&start&end categories+start+end 1", async () => {
  await supertest(app).get("/yelp/filter?state=MA&categories=Apartments&start=2019-03-01&end=2019-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(28)
      expect(response.body.results).toStrictEqual(yelp_results.yelp_filter_all)

    });
});

test("GET /yelp/filter?state&categories&start&end state+categories+start+end 2", async () => {
  await supertest(app).get("/yelp/filter?state=PA&categories=Restaurants&start=2019-03-01&end=2020-03-31")
    .expect(200)
    .then((response) => {
      expect(response.body.results.length).toEqual(70)
    });
});

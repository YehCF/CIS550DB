import config from "./config.json";

const getAllStates = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/states`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getAllStocks = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/stocks`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getAllIndustries = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/industries`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStocks = async (
  code,
  state,
  start,
  end,
  industry,
  threshold,
  corr
) => {
  console.log(
    `http://${config.server_host}:${config.server_port}/search/stocks?code=${code}&state=${state}&start=${start}&end=${end}&industry=${industry}&threshold=${threshold}&corr=${corr}`
  );
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/search/stocks?code=${code}&state=${state}&start=${start}&end=${end}&industry=${industry}&threshold=${threshold}&corr=${corr}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getCaseAndStock = async (code, state, start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/case/stock?code=${code}&state=${state}&start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStateVolatility = async (start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/state/volatility?start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStateIndustry = async (start, end, threshold) => {
  console.log(
    `http://${config.server_host}:${config.server_port}/state/industry?start=${start}&end=${end}&threshold=${threshold}`
  );
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/state/industry?start=${start}&end=${end}&threshold=${threshold}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getStateCaseNorm = async (start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/state/case/norm?start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getYelpMap = async (start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/yelp?start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getYelpCategories = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/yelp/categories`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getYelpState = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/yelp/state`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getYelpTime = async () => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/yelp/time`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getYelpFilter = async (start, end, state, categories) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/yelp/filter?start=${start}&end=${end}&state=${state}&categories=${categories}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getCovidData = async (start, end, state) => {
  if (state) {
    var res = await fetch(
      `http://${config.server_host}:${config.server_port}/covid/filter?start=${start}&end=${end}&state=${state}`,
      {
        method: "GET",
      }
    );
    return res.json();
  } else {
    var res = await fetch(
      `http://${config.server_host}:${config.server_port}/covid/filter?start=${start}&end=${end}`,
      {
        method: "GET",
      }
    );
    return res.json();
  }
};

const getCaseAndVax = async (state, start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/covid/vax?state=${state}&start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

// ROUTE FOR MAIN PAGE
const getCaseAndVaxCulm = async (state, start, end) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/covid/vax/culm?state=${state}&start=${start}&end=${end}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getCovidSeason = async (state) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/covid/season?state=${state}`,
    {
      method: "GET",
    }
  );
  return res.json();
};

const getNews = async (topic, page, language, sortBy) => {
  //this API have support pagination, but I think showing 10-20 news are enough
  try {
    var res = await fetch(
      `https://newsapi.org/v2/everything?q=${topic}&apiKey=${config.api_key}&pageSize=${page}&language=${language}&sortBy=${sortBy}`,
      {
        method: "GET",
      }
    );
    // console.log(res.json().articles);
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

const getPartyCounts = async (yearmin, yearmax) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/elections?minyear=${yearmin}&maxyear=${yearmax}`,
    { method: "GET" }
  );
  return res.json();
};

const getPopulousVotes = async (yearmin, yearmax, limit) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/elections/populous/?minyear=${yearmin}&maxyear=${yearmax}&limit=${limit}`
  );
  return res.json();
};

const getPercentVotes = async (yearmin, yearmax, party) => {
  var res = await fetch(
    `http://${config.server_host}:${config.server_port}/elections/party/?minyear=${yearmin}&maxyear=${yearmax}&party=${party}`
  );
  return res.json();
};

export {
  getCaseAndStock,
  getAllStocks,
  getAllStates,
  getAllIndustries,
  getStocks,
  getStateVolatility,
  getStateCaseNorm,
  getStateIndustry,
  getYelpMap,
  getYelpCategories,
  getYelpState,
  getYelpTime,
  getYelpFilter,
  getCovidData,
  getCaseAndVax,
  getCovidSeason,
  getCaseAndVaxCulm,
  getNews,
  getPopulousVotes,
  getPartyCounts,
  getPercentVotes,
};

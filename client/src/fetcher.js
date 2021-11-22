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
  var res = await fetch(`http://${config.server_host}:${config.server_port}/yelp?start=${start}&end=${end}`, {
      method: 'GET',
  })
  return res.json()
}

const getYelpCategories = async () => {
  var res = await fetch(`http://${config.server_host}:${config.server_port}/yelp/categories`, {
      method: 'GET',
  })
  return res.json()
}

const getYelpState = async () => {
  var res = await fetch(`http://${config.server_host}:${config.server_port}/yelp/state`, {
      method: 'GET',
  })
  return res.json()
}

const getYelpTime = async () => {
  var res = await fetch(`http://${config.server_host}:${config.server_port}/yelp/time`, {
      method: 'GET',
  })
  return res.json()
}

const getYelpFilter = async (start, end, state, categories) => {
  var res = await fetch(`http://${config.server_host}:${config.server_port}/yelp/filter?start=${start}&end=${end}&state=${state}&categories=${categories}`, {
      method: 'GET',
  })
  return res.json()
}
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
  getYelpFilter
};

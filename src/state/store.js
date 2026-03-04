'use strict';

import { createStore } from 'redux';

// Define initial state
const initialState = {
  orbs: [],
  threads: [],
  audioParameters: {},
  appSettings: {},
};

// Define reducer
const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_ORBS':
      return { ...state, orbs: action.payload };
    case 'SET_THREADS':
      return { ...state, threads: action.payload };
    case 'SET_AUDIO_PARAMETERS':
      return { ...state, audioParameters: action.payload };
    case 'SET_APP_SETTINGS':
      return { ...state, appSettings: action.payload };
    default:
      return state;
  }
};

// Create Redux store
const store = createStore(rootReducer);

export default store;

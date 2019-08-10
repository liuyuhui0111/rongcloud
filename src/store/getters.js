/* eslint-disable */
const getters = {
    token: state => state.token,
    userId: (state) => {
      return state.userId ? state.userId : window.sessionStorage.getItem('userId');
    },
    // getDemoTitle: state => state.demo.title,
};

export default getters;

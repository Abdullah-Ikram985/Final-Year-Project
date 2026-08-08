// module.exports = (fn) => (req, res, next){ fn(req, res, next).catch(err)=>{next(err)}};

module.exports = (fn) => {
  console.log('====> [checkAsync is called]');
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

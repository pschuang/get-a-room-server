const getCloseTime = async (req, res) => {
  const { bulletinCloseTime } = req
  res.json({ bulletinCloseTime })
}

module.exports = {
  getCloseTime,
}

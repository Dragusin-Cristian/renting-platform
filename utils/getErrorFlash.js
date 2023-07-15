const getFlashMessage = (flashArr) => {
  if (flashArr.length > 0) {
    return flashArr[0]
  } else {
    return null
  }
}

module.exports = getFlashMessage

const pdfParseModule = require('pdf-parse');

const pdfParse =
  pdfParseModule.default || pdfParseModule;

const extractTextFromBuffer = async (buffer) => {
  try {
    const result = await pdfParse(buffer);

    return result.text;
  } catch (err) {
    console.error('PDF PARSE ERROR:', err);
    throw err;
  }
};

module.exports = extractTextFromBuffer;

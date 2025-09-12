// 驼峰命名法转中文
export const camelCaseToChinese = async camelCase => {
  if (!camelCase) {
    return "创建时间";
  }

  // 将驼峰命名法转换为单词数组
  const words = camelCase
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ");
  // 将每个单词翻译为中文
  const chineseWords = await Promise.all(words.map(word => translateWord(word.toLowerCase())));
  return chineseWords.join("");
};

// 翻译单词
const translateWord = async word => {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh`
    );
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.warn(`翻译失败: ${word}`, error);
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
};

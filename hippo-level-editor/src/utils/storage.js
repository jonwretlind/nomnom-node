export const saveLevel = (levelData) => {
  const levels = JSON.parse(localStorage.getItem('levels') || '{}');
  levels[levelData.level] = levelData;
  localStorage.setItem('levels', JSON.stringify(levels));
};

export const loadLevels = () => {
  return JSON.parse(localStorage.getItem('levels') || '{}');
};

export const exportToJson = (levelData) => {
  const dataStr = JSON.stringify({ levels: [levelData] }, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `level-${levelData.level}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}; 
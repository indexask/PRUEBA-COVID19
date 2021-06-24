const covid = async () => {
  const response = await fetch("http://localhost:3000/api/total");
  const data = await response.json();
  return data;
};

export { covid };

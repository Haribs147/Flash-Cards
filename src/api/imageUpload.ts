export const uploadImageToServer = (file: File): Promise<string> => {
  console.log("Rozpoczynam przesyłanie pliku:", file.name);

  return new Promise((resolve) => {
    // Symulujemy opóźnienie sieciowe (np. 1.5 sekundy)
    setTimeout(() => {
      // W prawdziwej aplikacji serwer zwróciłby prawdziwy URL.
      // My zwracamy losowy obrazek z serwisu placeholderowego.
      const imageUrl = `https://picsum.photos/800/400?random=${Math.random()}`;
      console.log("Plik przesłany! URL:", imageUrl);
      resolve(imageUrl);
    }, 1500);
  });
};

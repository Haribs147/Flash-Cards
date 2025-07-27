export const uploadImageToServer = (file: File): Promise<string> => {
    console.log("Rozpoczynam przesyłanie pliku:", file.name);

    return new Promise((resolve) => {
        setTimeout(() => {
            const imageUrl = `https://picsum.photos/800/400?random=${Math.random()}`;
            console.log("Plik przesłany! URL:", imageUrl);
            resolve(imageUrl);
        }, 1500);
    });
};

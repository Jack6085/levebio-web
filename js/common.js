document.addEventListener("DOMContentLoaded", function() {
    // 1. 載入 Header (導覽列)
    fetch("components/header.html")
        .then(response => response.text())
        .then(data => {
            // 把讀取到的 header.html 內容塞進 placeholder
            document.getElementById("header-placeholder").innerHTML = data;

            // 2. Header 載入完成後，動態加入 Google 翻譯功能
            // (因為翻譯按鈕通常在 Header 裡面，所以要等 Header 出現後再載入)
            const script = document.createElement("script");
            script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            document.body.appendChild(script);
        })
        .catch(error => console.error("無法載入 Header:", error));

    // 3. 載入 Footer (頁尾)
    fetch("components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer-placeholder").innerHTML = data;
        })
        .catch(error => console.error("無法載入 Footer:", error));
});

// Google 翻譯初始化設定
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'zh-TW',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}

// 工具：處理 YouTube 網址，轉換成嵌入格式 (Embed)
function getYoutubeEmbedUrl(url) {
    if (!url) return "";
    let videoId = "";
    // 使用正規表達式抓取 ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) videoId = match[2];
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

// 工具：呼叫後端 API (注意：純靜態網頁無法使用這個)
async function fetchAPI(endpoint) {
    try {
        const response = await fetch('/api' + endpoint);
        return await response.json();
    } catch (e) {
        console.error("API 錯誤:", e);
        return [];
    }
}

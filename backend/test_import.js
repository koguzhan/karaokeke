import YTDlpWrap from 'yt-dlp-wrap';
console.log('Type of YTDlpWrap:', typeof YTDlpWrap);
console.log('YTDlpWrap value:', YTDlpWrap);
try {
    new YTDlpWrap();
    console.log('Constructor worked');
} catch (e) {
    console.log('Constructor failed:', e.message);
}

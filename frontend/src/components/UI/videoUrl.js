// Mirrors detectVideoPlatform in backend/src/controllers/abroadController.js,
// plus the shape (vertical reel/short vs landscape) the player needs.
export function parseVideo(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.toLowerCase().replace(/^www\.|^m\.|^web\./, '');

  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) {
    let id = null;
    let vertical = false;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (u.pathname.startsWith('/shorts/')) { id = u.pathname.split('/')[2]; vertical = true; }
    else if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/live/')) id = u.pathname.split('/')[2];
    else id = u.searchParams.get('v');
    if (!id) return null;
    return {
      platform: 'youtube',
      vertical,
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`,
    };
  }

  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') {
    const vertical = /\/reels?\//.test(u.pathname) || host === 'fb.watch';
    return {
      platform: 'facebook',
      vertical,
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=${vertical ? 320 : 560}`,
    };
  }

  return null;
}

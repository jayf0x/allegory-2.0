import { useEffect, useState } from 'react';
import { LinearFilter, VideoTexture } from 'three';
import { BASE_URL } from '@/config';

/**
 * useVideo — owns the hidden <video> element and exposes its VideoTexture
 * plus the source aspect ratio (needed for cover-fit cropping onto the
 * portrait monolith face).
 */
export function useVideo() {
  const [video, setVideo] = useState({ texture: null, aspect: 16 / 9 });

  useEffect(() => {
    const vid = document.createElement('video');
    vid.src = `${BASE_URL}video.mp4`;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.crossOrigin = 'anonymous';

    const tex = new VideoTexture(vid);
    tex.minFilter = LinearFilter;

    const onPlaying = () => {
      setVideo({
        texture: tex,
        aspect: vid.videoWidth / vid.videoHeight || 16 / 9,
      });
    };
    vid.addEventListener('playing', onPlaying);

    // Autoplay can be blocked until first interaction
    const retry = () => vid.play().catch(() => {});
    vid.play().catch(() => window.addEventListener('pointerdown', retry, { once: true }));

    return () => {
      vid.removeEventListener('playing', onPlaying);
      window.removeEventListener('pointerdown', retry);
      vid.pause();
      vid.src = '';
      tex.dispose();
      setVideo({ texture: null, aspect: 16 / 9 });
    };
  }, []);

  return video;
}

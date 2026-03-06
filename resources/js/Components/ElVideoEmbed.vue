<script setup>
import { computed } from 'vue';

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});

const getPlatform = (url) => {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  if (/facebook\.com/.test(url)) return 'facebook';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/instagram\.com/.test(url)) return 'instagram';
  if (/dailymotion\.com/.test(url)) return 'dailymotion';
  if (/bilibili\.com/.test(url)) return 'bilibili';
  if (/\.(mp4|mov|webm|ogg)$/i.test(url)) return 'html5';
  return 'unknown';
};

const embedUrl = computed(() => {
  const url = props.url;
  const platform = getPlatform(url);

  switch (platform) {
    case 'youtube': {
      try {
        const urlObj = new URL(url);
        let videoId = null;

        if (urlObj.searchParams.has('v')) {
          videoId = urlObj.searchParams.get('v');
        }

        else if (urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.slice(1);
        }

        else if (urlObj.pathname.startsWith('/shorts/')) {
          videoId = urlObj.pathname.split('/')[2];
        }

        else if (urlObj.pathname.startsWith('/embed/')) {
          videoId = urlObj.pathname.split('/')[2];
        }

        videoId = videoId?.split('?')[0];

        return videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : null;
      } catch {
        return null;
      }
    }

    case 'vimeo': {
      try {
        const urlObj = new URL(url);
        const videoId = urlObj.pathname.split('/').pop();
        return /^\d+$/.test(videoId)
          ? `https://player.vimeo.com/video/${videoId}`
          : null;
      } catch {
        return null;
      }
    }

    case 'facebook':
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;

    case 'dailymotion': {
      const id = url.match(/video\/([^_]+)/)?.[1];
      return id
        ? `https://www.dailymotion.com/embed/video/${id}`
        : null;
    }

    case 'bilibili': {
      const id = url.match(/video\/(BV[^/?]+)/)?.[1];
      return id
        ? `https://player.bilibili.com/player.html?bvid=${id}`
        : null;
    }

    case 'html5':
      return null;

    default:
      return null;
  }
});

const isIframe = computed(() => embedUrl.value !== null);
</script>

<template>
  <div class="w-full">
    <video
      v-if="!isIframe"
      :src="url"
      controls
      class="w-full rounded"
    ></video>

    <iframe
      v-else
      :src="embedUrl"
      class="aspect-video w-full rounded"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
</template>

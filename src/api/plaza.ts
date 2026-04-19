// src/api/plaza.ts
import { ref, onMounted } from 'vue';
import request from '@/api/request';
import { useUserStore } from '@/store/UserStore';
import { useRouter } from 'vue-router';

// 新闻类型（如果有新闻功能）
interface NewsItem {
  id: number;
  userId: number;
  title: string;
  content: string;
  updateTime: string;
}

// 帖子完整数据（后端返回）
export interface PostVO {
  id: number;
  userId: number;
  userName: string;
  userIcon: string;
  postTitle: string;
  postContent: string;
  updateTime: string;
  likeCount: number;
  viewCount: number;
  shareCount: number;
  commentCount: number;
  isLiked: boolean;
}

export default function usePlaza() {
  const news = ref<NewsItem[]>([]);
  const postList = ref<PostVO[]>([]);
  const userPostContent = ref<string>('');
  const loading = ref(false);

  const userStore = useUserStore();
  const router = useRouter();

  // 获取新闻（保留，但暂未使用）
  const getNews = async () => {
    const res = await request.get<NewsItem[]>('/news');
    if (res.code === 200) news.value = res.data;
  };

  // 获取帖子列表（分页）
  const getpost = async (page = 1, size = 10) => {
    loading.value = true;
    try {
      const res = await request.get<PostVO[]>('/post', { params: { page, size } });
      if (res.code === 200) {
        postList.value = res.data;
      }
    } catch (e) {
      console.error('获取帖子失败', e);
    } finally {
      loading.value = false;
    }
  };

  // 点赞
  const postLike = async (postId: number) => {
    await request.post('/post/like', null, { params: { postId } });
  };

  // 分享
  const postShare = async (postId: number) => {
    await request.post('/post/share', null, { params: { postId } });
  };

  // 浏览
  const postView = async (postId: number) => {
    await request.post('/post/views', null, { params: { postId } });
  };

  // 发帖
  const userSendPost = async () => {
    if (!userPostContent.value.trim()) {
      alert('请输入内容');
      return;
    }
    const res = await request.post('/post/sendPost', null, {
      params: { postContent: userPostContent.value }
    });
    if (res.code === 200) {
      userPostContent.value = '';
      // 重新加载第一页
      await getpost(1, 10);
    }
  };

  // 点赞并更新本地状态
  const gainLike = async (postId: number) => {
    await postLike(postId);
    const post = postList.value.find(p => p.id === postId);
    if (post) {
      const wasLiked = post.isLiked;
      post.isLiked = !wasLiked;
      post.likeCount += wasLiked ? -1 : 1;
    }
  };

  // 分享并更新本地状态
  const gainShare = async (postId: number) => {
    await postShare(postId);
    const post = postList.value.find(p => p.id === postId);
    if (post) post.shareCount++;
  };

  // 浏览并更新本地状态
  const gainView = async (postId: number) => {
    await postView(postId);
    const post = postList.value.find(p => p.id === postId);
    if (post) post.viewCount++;
  };

  // 发帖
  const sendPost = async () => {
    await userSendPost();
  };

  // 计算时间差
  const calculateTimeDifference = (dateString: string): string => {
    const targetTime = new Date(dateString).getTime();
    const diff = Date.now() - targetTime;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`;
    return `${Math.floor(seconds / 86400)} 天`;
  };

  onMounted(() => {
    getpost(1, 10);
  });

  return {
    news,
    postList,
    userPostContent,
    loading,
    calculateTimeDifference,
    gainLike,
    gainShare,
    gainView,
    sendPost,
    router,
  };
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, Input, App, Tag, Avatar } from 'antd';
import {
  NotificationOutlined,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  GiftOutlined,
  TrophyOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

export function PersonalSocialScreen() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [newPostText, setNewPostText] = useState('');
  const [posts, setPosts] = useState<any[]>([]);

  const fetchSocial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/me/social');
      setData(res.data);
      setPosts(res.data.posts || []);
    } catch {
      message.error('Không thể tải bảng tin mạng nội bộ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocial();
  }, [fetchSocial]);

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1,
          };
        }
        return p;
      }),
    );
  };

  const handlePost = () => {
    if (!newPostText.trim()) return;
    const newPost = {
      id: `post-${Date.now()}`,
      authorName: 'Bạn (Nhân viên)',
      authorRole: 'Đang làm việc',
      timeAgo: 'Vừa xong',
      content: newPostText,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
    };
    setPosts([newPost, ...posts]);
    setNewPostText('');
    message.success('🎉 Đã chia sẻ bài viết lên bảng tin nội bộ!');
  };

  const announcements: any[] = data?.announcements || [];
  const monthBirthdays: any[] = data?.monthBirthdays || [];
  const kudos: any[] = data?.kudos || [];

  return (
    <div className="personal-content" style={{ paddingBottom: 24 }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 12, color: '#64748b' }}>Đang tải bảng tin nội bộ…</p>
        </div>
      ) : (
        <>
          {/* ── Thông báo từ Ban Lãnh Đạo / HR ── */}
          {announcements.length > 0 && (
            <div className="personal-section-card" style={{ borderLeft: '4px solid #0284c7' }}>
              <div className="personal-section-title">
                <span>Thông báo công ty</span>
                <NotificationOutlined style={{ color: '#0284c7' }} />
              </div>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                    {ann.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                    {ann.author} • {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                    {ann.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Sinh nhật trong tháng & Vinh danh ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            {/* Box 1: Sinh nhật tháng */}
            <div className="personal-section-card" style={{ margin: 0, padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#d97706', marginBottom: 8 }}>
                <GiftOutlined />
                <span>Sinh nhật tháng {new Date().getMonth() + 1}</span>
              </div>
              {monthBirthdays.length === 0 ? (
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Không có sinh nhật tháng này</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {monthBirthdays.slice(0, 3).map((b) => (
                    <div key={b.id} style={{ fontSize: 12, color: '#334155' }}>
                      🎂 <strong>{b.name}</strong> ({b.day}/{new Date().getMonth() + 1})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Box 2: Vinh danh khen thưởng */}
            <div className="personal-section-card" style={{ margin: 0, padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#16a34a', marginBottom: 8 }}>
                <TrophyOutlined />
                <span>Bảng vinh danh</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {kudos.map((k, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: '#334155' }}>
                    {k.badge} <strong>{k.name}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Ô đăng bài viết ── */}
          <div className="personal-section-card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Input.TextArea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Chia sẻ tin tức, thảo luận cùng đồng nghiệp…"
                rows={2}
                style={{ borderRadius: 8 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="small"
                onClick={handlePost}
                style={{ backgroundColor: '#0284c7', borderRadius: 6 }}
              >
                Đăng bài
              </Button>
            </div>
          </div>

          {/* ── Danh sách bài viết Newsfeed ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {posts.map((post) => (
              <div key={post.id} className="personal-section-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Avatar style={{ backgroundColor: '#0284c7' }}>
                    {(post.authorName[0] || 'U').toUpperCase()}
                  </Avatar>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b' }}>
                      {post.authorName}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
                      {post.authorRole} • {post.timeAgo}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5, marginBottom: 12 }}>
                  {post.content}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 18,
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: 10,
                    fontSize: 13,
                    color: '#64748b',
                  }}
                >
                  <button
                    onClick={() => handleLike(post.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: post.isLiked ? '#ef4444' : '#64748b',
                      fontWeight: post.isLiked ? 600 : 400,
                    }}
                  >
                    {post.isLiked ? <HeartFilled /> : <HeartOutlined />}
                    <span>{post.likesCount} Thích</span>
                  </button>

                  <button
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#64748b',
                    }}
                  >
                    <CommentOutlined />
                    <span>{post.commentsCount} Bình luận</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

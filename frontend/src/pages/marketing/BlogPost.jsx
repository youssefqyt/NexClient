import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Sparkles, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { blogService } from '../../services/contentService';
import { formatDate } from '../../utils/format';

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    blogService
      .getById(id)
      .then(({ data }) => setPost(data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-12 w-full" />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <EmptyState
          title="Article not found"
          description="This post may have been unpublished or the link is incorrect."
          actionLabel="Back to blog"
          actionTo="/blog"
        />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Back to blog
      </Link>

      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} /> {formatDate(post.published_at ?? post.created_at)}
          </span>
          {post.author?.name && (
            <span className="inline-flex items-center gap-1.5">
              <User size={13} /> {post.author.name}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{post.excerpt}</p>
        )}
        {post.tags?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.header>

      <div className="my-10 h-px bg-slate-200 dark:bg-slate-800" />

      <div className="space-y-5 text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {String(post.content)
          .split('\n')
          .filter((line) => line.trim())
          .map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
      </div>

      <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50/70 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <Sparkles className="mx-auto text-brand-500" size={26} />
        <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
          Ready to try NexClient?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Start your free 14-day trial — no credit card required.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button to="/register" variant="gradient">
            Start free trial
          </Button>
          <Button to="/pricing" variant="secondary">
            See pricing
          </Button>
        </div>
      </div>
    </article>
  );
}

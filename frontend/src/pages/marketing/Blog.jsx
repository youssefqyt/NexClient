import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import Card from '../../components/ui/Card';
import Pagination from '../../components/ui/Pagination';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { blogService } from '../../services/contentService';
import { formatDate, paginate, truncate } from '../../utils/format';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    blogService
      .getAll({ page, per_page: 6 })
      .then(({ data }) => {
        setPosts(data.data ?? []);
        setMeta(paginate(data).meta);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page]);

  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Blog</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Playbooks for modern agencies
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Delivery processes, pricing strategy and product updates from the NexClient team.
        </p>
      </div>

      {loading ? (
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          className="mt-14"
          icon={Newspaper}
          title="No articles yet"
          description="Check back soon — we publish new playbooks every month."
        />
      ) : (
        <>
          {featured && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-14">
              <Link to={`/blog/${featured.id}`} className="group block">
                <Card hover padded={false} className="overflow-hidden">
                  <div className="grid lg:grid-cols-2">
                    <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-accent-100 dark:from-brand-950 dark:via-slate-900 dark:to-slate-800">
                      <span className="text-sm font-semibold uppercase tracking-widest text-brand-500/70">
                        Featured
                      </span>
                    </div>
                    <div className="p-8">
                      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <CalendarDays size={13} /> {formatDate(featured.published_at ?? featured.created_at)}
                      </p>
                      <h2 className="mt-3 text-2xl font-bold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white">
                        {featured.title}
                      </h2>
                      <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                        {truncate(featured.excerpt ?? featured.content, 220)}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-brand-600">
                        Read article <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {rest.map((post) => (
              <Link key={post.id} to={`/blog/${post.id}`} className="group">
                <Card hover className="flex h-full flex-col">
                  <p className="text-xs font-medium text-slate-400">
                    {formatDate(post.published_at ?? post.created_at)}
                  </p>
                  <h3 className="mt-2 font-semibold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {truncate(post.excerpt ?? post.content, 130)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                    Read more <ArrowRight size={14} />
                  </span>
                </Card>
              </Link>
            ))}
          </div>

          {meta && (
            <Pagination className="mt-12" meta={meta} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

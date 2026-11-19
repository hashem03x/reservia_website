import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { useLanguage } from '../i18n/LanguageContext';
import { cmsFeed } from '../content/cmsFeed';
import { publishedBlogPosts, blogCategories, blogTitle, blogExcerpt } from '../cms/blog';

const PAGE_SIZE = 9;

/**
 * Public blog listing - reads the build-time CMS feed directly (no runtime fetch, same as every
 * other page on this site - see content/cmsFeed.ts's own header comment on why). Category/tag
 * filtering and "load more" are plain client-side array operations over the already-fetched list;
 * there is no pagination endpoint to call, matching the site's "nothing is fetched at runtime"
 * architecture.
 */
export default function BlogIndex() {
  const { language, t } = useLanguage();
  const posts = useMemo(() => publishedBlogPosts(cmsFeed, language), [language]);
  const categories = useMemo(() => blogCategories(cmsFeed, language), [language]);
  const [category, setCategory] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = category ? posts.filter((p) => p.category === category) : posts;
  const shown = filtered.slice(0, visible);

  return (
    <>
      <Seo page="blog" path="/blog" />
      <section className="wrap" style={{ paddingTop: 32 }}>
        <Breadcrumbs path="/blog" />
        <h1>{t.blog_hero_title}</h1>
        <p className="lead">{t.blog_hero_text}</p>

        {posts.length === 0 ? (
          <div className="cms-empty">
            <p>
              <b>{t.blog_empty_title}</b>
            </p>
            <p>{t.blog_empty_text}</p>
          </div>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="blog-filters" role="group" aria-label={t.blog_hero_title}>
                <button type="button" className={category === null ? 'active' : ''} onClick={() => setCategory(null)}>
                  {t.blog_all_categories}
                </button>
                {categories.map((c) => (
                  <button key={c} type="button" className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div className="cms-grid" style={{ marginTop: 24 }}>
              {shown.map((post) => (
                <article key={post.slug} className="cms-card">
                  {post.featuredImage?.url && <img className="cms-card-img" src={post.featuredImage.url} alt={language === 'ar' ? post.featuredImage.altAr || '' : post.featuredImage.altEn || ''} loading="lazy" />}
                  <div className="cms-card-body">
                    {post.category && <span className="blog-category-badge">{post.category}</span>}
                    <h3>{blogTitle(post, language)}</h3>
                    <p>{blogExcerpt(post, language)}</p>
                    {post.publishedAt && (
                      <time dateTime={post.publishedAt} className="blog-date">
                        {new Date(post.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                    )}
                    <Link to={`/${language}/blog/${post.slug}`} className="more">
                      {t.blog_read_more}
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {visible < filtered.length && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button type="button" className="btn" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  {t.blog_load_more}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

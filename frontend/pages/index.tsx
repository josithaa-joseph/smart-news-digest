import styles from '../styles/News.module.css';
import { useState, useEffect } from 'react';

interface Article {
  url: string;
  title: string;
  summary: string;
  content: string;
  created_at?: string;
  source?: {
    name?: string;
  };
}

export default function Home() {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:8000/test-news');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch news (Status: ${response.status})`);
        }

        const data = await response.json();
        const articles = Array.isArray(data?.articles) ? data.articles : [];
        const validatedArticles = articles.filter(article => 
          article?.url && article?.title && article?.summary
        );

        setNews(validatedArticles);
        
        if (validatedArticles.length === 0 && articles.length > 0) {
          throw new Error('Received articles but missing required fields');
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading latest news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>⚠️ Error loading news</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>No articles available</h2>
        <p>Please try again later or check your network connection.</p>
      </div>
    );
  }

  return (
    <div className={styles.newsContainer}>
      <header className={styles.header}>
        <h1>Tech News Digest</h1>
        <p className={styles.lastUpdated}>
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </header>
      
      <div className={styles.articlesGrid}>
        {news.map((article) => (
          <article key={article.url} className={styles.articleCard}>
            <div className={styles.articleHeader}>
              <h3 className={styles.articleTitle}>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {article.title}
                </a>
              </h3>
              {article.source?.name && (
                <span className={styles.sourceBadge}>
                  {article.source.name}
                </span>
              )}
            </div>
            
            <p className={styles.articleSummary}>{article.summary}</p>
            
            <div className={styles.articleFooter}>
              <span className={styles.cacheStatus}>
                {article.created_at ? 
                  `🔄 Cached at ${new Date(article.created_at).toLocaleTimeString()}` : 
                  '🆕 Fresh'}
              </span>
              <div className={styles.actions}>
                <button 
                  className={styles.readButton}
                  onClick={() => alert(article.content)}
                  aria-label="Show full content"
                >
                  Show Full Content
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
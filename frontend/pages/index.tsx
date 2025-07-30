import styles from '../styles/News.module.css';
import { useState, useEffect } from 'react'

export default function Home() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/test-news')
      .then(res => res.json())
      .then(data => {
        setNews(data.articles)
        setLoading(false)
      })
  }, [])

  return (
    <div className={styles.newsContainer}>
      <h1>Tech News Digest</h1>
      
      {loading ? (
        <p>Loading news...</p>
      ) : (
        <div>
          {news.map((article) => (
            <div key={article.url} className={styles.articleCard}>
              <h3 className={styles.articleTitle}>{article.title}</h3>
              <p className={styles.articleSummary}>{article.summary}</p>
              <div>
                <button 
                  onClick={() => alert(article.content)}
                  className={styles.readMoreBtn}
                >
                  Show Full Text
                </button>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.originalLink}
                >
                  Read Original
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
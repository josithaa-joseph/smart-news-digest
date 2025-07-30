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
    <div>
      <h1>Tech News</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {news.map((article, index) => (
            <li key={index}>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
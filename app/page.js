"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState(null);

  async function searchBooks(event) {
    event.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm) {
      setMessage({ type: "error", text: "책 제목이나 저자를 입력해 주세요." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/books?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "책을 검색하지 못했습니다.");
      setBooks(data.books);
      if (data.books.length === 0) {
        setMessage({ type: "info", text: "검색 결과가 없습니다. 다른 검색어를 입력해 보세요." });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function saveBook(book) {
    if (!isSupabaseConfigured || !supabase) {
      setMessage({
        type: "error",
        text: "Supabase 환경변수가 설정되지 않았습니다. .env.local에 연결 정보를 추가해 주세요.",
      });
      return;
    }

    setSavingId(book.googleId);
    setMessage(null);
    try {
      const { error } = await supabase.from("books").insert({
        google_id: book.googleId,
        title: book.title,
        authors: book.authors.join(", "),
        publisher: book.publisher,
        published_date: book.publishedDate,
        description: book.description,
        thumbnail: book.thumbnail,
        category: book.categories[0] || "",
        page_count: book.pageCount,
        preview_link: book.previewLink,
        status: "want_to_read",
        notes: "",
      });

      if (error?.code === "23505") {
        setMessage({ type: "info", text: "이미 내 책장에 저장된 책입니다." });
      } else if (error) {
        setMessage({
          type: "error",
          text: `책을 저장하지 못했습니다: ${error.message} (Supabase RLS 정책과 테이블 컬럼을 확인해 주세요.)`,
        });
      } else {
        setMessage({ type: "success", text: "책을 내 책장에 저장했습니다." });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `책을 저장하지 못했습니다: ${error.message || "네트워크 연결을 확인해 주세요."}`,
      });
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/">BOOK<span>LOG</span></Link>
          <nav className="nav-links" aria-label="주요 메뉴">
            <Link className="nav-link active" href="/">홈</Link>
            <Link className="nav-link" href="/library">내 서재</Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <p className="eyebrow">YOUR READING, YOUR STORY</p>
          <h1>읽고 싶은 책을 찾고<br />나만의 기록을 시작해요.</h1>
          <p className="hero-copy">
            책을 검색해 책장에 담고, 한 권씩 읽어 가는 순간을 BOOKLOG에 기록해 보세요.
          </p>
          <form className="search-form" onSubmit={searchBooks}>
            <input
              aria-label="책 제목 또는 저자 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="책 제목이나 저자를 검색해 보세요"
            />
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "검색 중..." : "책 검색"}
            </button>
          </form>
        </section>

        {message && (
          <p className={`notice ${message.type === "error" ? "error" : message.type === "success" ? "success" : ""}`} role="status">
            {message.text}
          </p>
        )}

        {books.length > 0 && (
          <>
            <div className="section-heading">
              <div>
                <h2>검색 결과</h2>
                <p>{books.length}권의 책을 찾았습니다.</p>
              </div>
            </div>
            <div className="book-grid">
              {books.map((book) => (
                <article className="book-card" key={book.googleId}>
                  <div className="book-cover-wrap">
                    {book.thumbnail ? (
                      <Image
                        className="book-cover"
                        src={book.thumbnail}
                        alt={`${book.title} 표지`}
                        width={180}
                        height={245}
                        sizes="(max-width: 640px) 45vw, 180px"
                      />
                    ) : (
                      <div className="cover-placeholder" aria-label="표지 없음">▤</div>
                    )}
                  </div>
                  <div className="book-card-body">
                    <h3>{book.title}</h3>
                    <p className="book-meta">
                      {book.authors.join(", ") || "저자 정보 없음"}
                      {book.publishedDate ? <><br />{book.publishedDate}</> : null}
                    </p>
                    <div className="card-action">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => saveBook(book)}
                        disabled={savingId === book.googleId}
                      >
                        {savingId === book.googleId ? "저장 중..." : "＋ 내 책장에 담기"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
      <footer className="footer">BOOKLOG · 나만의 독서 기록</footer>
    </div>
  );
}

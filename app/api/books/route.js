export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return Response.json({ error: "검색어를 입력해 주세요." }, { status: 400 });
  }

  try {
    const booksUrl = new URL("https://www.googleapis.com/books/v1/volumes");
    booksUrl.searchParams.set("q", query);
    booksUrl.searchParams.set("maxResults", "24");
    booksUrl.searchParams.set("printType", "books");
    if (process.env.GOOGLE_BOOKS_API_KEY) {
      booksUrl.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
    }

    const response = await fetch(booksUrl, { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 429) {
        return Response.json(
          { error: "Google Books 검색 요청이 잠시 많습니다. 잠시 후 다시 시도해 주세요." },
          { status: 429 },
        );
      }

      return Response.json(
        { error: "Google Books에서 책 정보를 가져오지 못했습니다." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const books = (data.items || []).map((item) => {
      const volume = item.volumeInfo || {};
      const imageLinks = volume.imageLinks || {};

      return {
        googleId: item.id,
        title: volume.title || "제목 정보 없음",
        authors: volume.authors || [],
        publisher: volume.publisher || "",
        publishedDate: volume.publishedDate || "",
        description: volume.description || "",
        thumbnail: (imageLinks.thumbnail || imageLinks.smallThumbnail || "")
          .replace("http://", "https://"),
        categories: volume.categories || [],
        pageCount: volume.pageCount || null,
        previewLink: volume.previewLink || "",
      };
    });

    return Response.json({ books });
  } catch (error) {
    console.error("Google Books API request failed:", error);
    return Response.json(
      { error: "책 검색 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}

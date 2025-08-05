let map;
let marker;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.5, lng: 127.5 }, // 한국 중심
    zoom: 7,
  });

  document.getElementById("searchBtn").addEventListener("click", searchBook);
}

function searchBook() {
  const title = document.getElementById("book-input").value.trim();
  if (!title) return alert("책 제목을 입력해주세요");

  fetch(`http://localhost:8000/search_book?book_title=${encodeURIComponent(title)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.location) {
        alert("❌ 해당 책의 장소를 찾을 수 없습니다.");
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: data.location }, (results, status) => {
        if (status === "OK" && results[0]) {
          const position = results[0].geometry.location;
          map.setCenter(position);
          map.setZoom(13);

          if (marker) marker.setMap(null);

          marker = new google.maps.Marker({
            position,
            map,
            title: `${data.book} - ${data.location}`,
          });
        } else {
          alert("❌ 주소를 찾을 수 없습니다.");
        }
      });
    })
    .catch(err => {
      console.error("❌ 서버 응답 오류:", err);
      alert("서버 오류가 발생했습니다.");
    });
}

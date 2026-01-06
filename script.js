document.addEventListener('DOMContentLoaded', () => {
    const TMDB_KEY = '4e44d9029b1270a757cddc766a1bcb63';
    let myChart;

    const getCollection = () => JSON.parse(localStorage.getItem('cinetech_elite') || '[]');
    const saveCollection = (data) => localStorage.setItem('cinetech_elite', JSON.stringify(data));

   
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));
            document.getElementById(btn.id.replace('nav-', 'view-')).classList.remove('hidden');
        };
    });

    const refreshUI = () => {
        const films = getCollection();
        
     
        document.getElementById('kpi-total').textContent = films.length;
        const avg = films.length ? (films.reduce((s, f) => s + f.rating, 0) / films.length).toFixed(1) : "0.0";
        document.getElementById('kpi-avg').textContent = avg;

      
        const reals = {};
        films.forEach(f => reals[f.director] = (reals[f.director] || 0) + 1);
        const topReal = Object.entries(reals).sort((a,b) => b[1] - a[1])[0];
        document.getElementById('kpi-top-real').textContent = topReal ? topReal[0] : "-";

  
        document.getElementById('table-body').innerHTML = films.map(f => `
            <tr>
                <td><strong>${f.title}</strong></td>
                <td>${f.director}</td>
                <td>${f.year}</td>
                <td><span style="color:var(--accent)">★ ${f.rating}</span></td>
                <td><button onclick="removeFilm(${f.id})" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:1.2rem">×</button></td>
            </tr>`).join('');

        updateChart(films);
    };

    const updateChart = (films) => {
        const ctx = document.getElementById('mainChart').getContext('2d');
        if(myChart) myChart.destroy();
        
        const lastFive = films.slice(-6);
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: lastFive.map(f => f.title),
                datasets: [{
                    label: 'Note Evolution',
                    data: lastFive.map(f => f.rating),
                    borderColor: '#00d2ff',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(0, 210, 255, 0.1)'
                }]
            },
            options: { 
                responsive: true, 
                scales: { y: { beginAtZero: true, max: 10, grid: { color: 'rgba(255,255,255,0.05)' } } } 
            }
        });
    };

    window.removeFilm = (id) => { saveCollection(getCollection().filter(f => f.id !== id)); refreshUI(); };

  
    document.getElementById('btn-show-form').onclick = () => document.getElementById('form-container').classList.toggle('hidden');
    
    document.getElementById('film-form').onsubmit = (e) => {
        e.preventDefault();
        const films = getCollection();
        films.push({
            id: Date.now(),
            title: document.getElementById('f-title').value,
            director: document.getElementById('f-director').value,
            year: document.getElementById('f-year').value,
            rating: parseFloat(document.getElementById('f-rating').value)
        });
        saveCollection(films);
        refreshUI();
        e.target.reset();
        document.getElementById('form-container').classList.add('hidden');
    };

   
    const searchApi = async (query = "") => {
        const url = query 
            ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${query}&language=fr-FR`
            : `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=fr-FR`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        document.getElementById('api-grid').innerHTML = data.results.slice(0, 12).map(m => `
            <div class="movie-card">
                <img src="https://image.tmdb.org/t/p/w500${m.poster_path}" onerror="this.src='https://via.placeholder.com/500x750'">
                <div class="movie-info">
                    <h4>${m.title}</h4>
                    <button class="btn-neon" style="width:100%; font-size:0.8rem" 
                        onclick="addFromApi('${m.title.replace(/'/g, "\\'")}', ${m.vote_average}, '${m.release_date}')">
                        AJOUTER +
                    </button>
                </div>
            </div>`).join('');
    };

    window.addFromApi = (title, rating, date) => {
        const films = getCollection();
        films.push({ id: Date.now(), title, director: "Inconnu (API)", year: date.split('-')[0], rating });
        saveCollection(films);
        refreshUI();
        alert(`"${title}" ajouté à la bibliothèque.`);
    };

    document.getElementById('btn-search').onclick = () => searchApi(document.getElementById('search-input').value);

    refreshUI();
    searchApi();
});
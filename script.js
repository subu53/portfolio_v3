async function loadRepos(){

const response = await fetch(
"https://api.github.com/users/subu53/repos"
);

const repos = await response.json();

const container =
document.getElementById("project-container");

repos.slice(0,6).forEach(repo => {

const div = document.createElement("div");

div.className="project";

div.innerHTML = `

<h3>${repo.name}</h3>

<p>${repo.description || "Machine learning project"}</p>

<a href="${repo.html_url}" target="_blank">
View Code
</a>

`;

container.appendChild(div);

});

document.getElementById("repo-count").innerText = repos.length;

}

loadRepos();
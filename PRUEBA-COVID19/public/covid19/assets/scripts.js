import { covid } from "./ConsultaDatos.js";

const dataCovid = async (dataTotalPaises) => {
  const datosCovidActivos = dataTotalPaises.filter(
    (pais) => pais.active >= 1000000
  ); //los filtre a 1 millon para que el grafico no se vea tan robusto
  const paisesCovid = datosCovidActivos.map((pais) => pais.location);
  const paisesCovidActive = datosCovidActivos.map((pais) => pais.active);
  const paisesCovidConfirmed = datosCovidActivos.map((pais) => pais.confirmed);
  const paisesCovidDeaths = datosCovidActivos.map((pais) => pais.deaths);
  const paisesCovidRecovered = datosCovidActivos.map((pais) => pais.recovered);
  //Grafico de todos los paises con mas de 1 millon de casos
  //Arreglo de datos de los paises
  const labels = paisesCovid;
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Activos",
        backgroundColor: "green",
        data: paisesCovidActive,
      },
      {
        label: "Fallecidos",
        backgroundColor: "red",
        data: paisesCovidConfirmed,
      },
      {
        label: "Confirmados",
        backgroundColor: "yellow",
        data: paisesCovidDeaths,
      },
      {
        label: "Recuperados",
        backgroundColor: "blue",
        data: paisesCovidRecovered,
      },
    ],
  };
  const config = {
    type: "bar",
    data: data,
    options: {
      plugins: {
        title: {
          display: true,
          text: "Grafico COVID-19",
        },
      },
    },
  };
  //Buscando el elemento myChart
  const myChartElement = document.getElementById("myChart");
  //Creando instancia de clase chart y pasando parametros)
  var myChart = new Chart(myChartElement, config);
};
//Pais por pais recorriendo y sacando los datos y se rellena en la tabla
const completarTabla = (dataTotalPaises) => {
  dataTotalPaises.forEach(
    ({ active, confirmed, deaths, location, recovered }) => {
      $("tbody").append(
        `   <tr>
      <th>${location}</th>
      <td>${confirmed}</td>
      <td>${deaths}</td>
      <td>${active}</td>
      <td>${recovered}</td>
      <td><button data-toggle="modal" data-target="#exampleModal" data-pais="${location}">detalles</button></td>
    </tr>
`
        //se agrego atributo personalizado a boton y ademas de guardar nombre del pais
      );
    }
  );
};
const ModalConvasJs = async (nombrePais) => {
  const response = await fetch(
    `http://localhost:3000/api/countries/${nombrePais}`
  );
  // HAGO UNA CONSULA A LA API MEDIANTE FETCH Y OBTENGO LOS DATOS MEDIANTE UN AWAIT
  //destructuring de lo que me devuevle la consulta
  const datosConvas = await response.json();
  const { active, confirmed, deaths, recovered } = datosConvas.data;
  //VARIABLES DE CONFIGURACIONES DE CHARTJS

  const data = {
    labels: ["Activos", "Confirmados", "Fallecidos", "Recuperados"],

    datasets: [
      {
        label: nombrePais,
        data: [active, confirmed, deaths, recovered],
        backgroundColor: [
          "rgb(255, 99, 132)",
          "rgb(54, 162, 235)",
          "rgb(121, 125, 127)",
          "rgb(255, 205, 86)",
        ],
        hoverOffset: 4,
      },
    ],
  };

  const config = {
    type: "doughnut",
    data: data,
    options: {
      plugins: {
        title: {
          display: true,
          text: `${nombrePais}`,
        },
      },
    },
  };

  const myChartElement = document.getElementById("myChartModal");
  var myChartModal = new Chart(myChartElement, config);
  //nueva instantcia de CHART Cuna clase

  const buttonCloseDeleteConvas = document.getElementById("buttonCloseDelete");
  buttonCloseDeleteConvas.addEventListener("click", () => {
    myChartModal.destroy();
  });

  $("#exampleModal").on("hidden.bs.modal", function (event) {
    myChartModal.destroy();
  });
};

(async () => {
  if (localStorage.getItem("jwt-token")) {
    $("#iniciarSesion").addClass("d-none");
    $("#SituacionChileNav").removeClass("d-none");
    $("#cerrarSesionNav").removeClass("d-none");
  }
  //consulta covid
  const { data: dataTotalPaises } = await covid();
  dataCovid(dataTotalPaises);
  completarTabla(dataTotalPaises);
  // un arreglo con todos los botones de la tabla correspondiente a cada pais
  const buttonPais = document.querySelectorAll("[data-pais]");
  buttonPais.forEach((boton) => {
    boton.addEventListener("click", (e) => {
      ModalConvasJs(e.target.dataset.pais);
    });
  });
})();
//a cada unos de los botones le asigno el evento click
// peticion post y le paso como parametro email passwrord si ambas son correctas te da el (jwk)
const obtenerToken = async (email, password) => {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      body: JSON.stringify({ email: email, password: password }),
    });

    if(!response.ok) throw "Error en la cosulta "
    const { token } = await response.json();
    localStorage.setItem("jwt-token", token);
    return token;
};

const loginButton = document.getElementById("js-form");
loginButton.addEventListener("click", async () => {
  try{
    const email = document.getElementById("js-input-email").value;
    const password = document.getElementById("js-input-password").value;
    const JWT = await obtenerToken(email, password);
    console.log("test")
    $("#SituacionChileNav").removeClass("d-none");
    $("#modalIniciarSesion").modal("hide");
    $("#cerrarSesionNav").removeClass("d-none");
    $("#iniciarSesion").addClass("d-none");
  }catch (err){
    console.log(err)
  }
});

const getDataChile = async (JWTtoken) => {
  const fetchChileConfirmed = axios.get("http://localhost:3000/api/confirmed", {
    headers: {
      Authorization: `Bearer ${JWTtoken}`,
    },
  });
  const fetchChileDeaths = axios.get("http://localhost:3000/api/deaths", {
    headers: {
      Authorization: `Bearer ${JWTtoken}`,
    },
  });
  const fetchChileRecovered = axios.get("http://localhost:3000/api/recovered", {
    headers: {
      Authorization: `Bearer ${JWTtoken}`,
    },
  });
  //promesas resueltas
  const [chileConfirmed, chileDeaths, chileRecovered] = await Promise.all([
    fetchChileConfirmed,
    fetchChileDeaths,
    fetchChileRecovered,
    //promesas pendientes
  ]);
  console.log(chileConfirmed);
  const casosConfirmados = chileConfirmed.data.data.map(
    (confirmados) => confirmados.total
  );
  // recorro el arreglo y devuelvo los confirmados tipo array
  const casosDeaths = chileDeaths.data.data.map((deaths) => deaths.total);
  const casosDRecuperados = chileRecovered.data.data.map(
    (recuperados) => recuperados.total
  );
  const fechasDeCasos = chileConfirmed.data.data.map((fechas) => fechas.date);
  const historialCovidDataChile = [
    casosConfirmados,
    casosDeaths,
    casosDRecuperados,
    fechasDeCasos,
  ];

  return historialCovidDataChile;
};

const crearGraficoChile = async (dataChile) => {
  const [casosConfirmados, casosDeaths, casosDRecuperados, fechasDeCasos] =
    dataChile;

  const labels = fechasDeCasos;
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Confirmados",
        data: casosConfirmados,
        fill: false,
        borderColor: "rgb(12, 192, 192)",
        tension: 0.1,
      },
      {
        label: "Muertos",
        data: casosDeaths,
        fill: false,
        borderColor: "rgb(121, 125, 127)",
        tension: 0.1,
      },
      {
        label: "Recuperados",
        data: casosDRecuperados,
        fill: false,
        borderColor: "rgb(255, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const config = {
    type: "line",
    data: data,
    options: {
      plugins: {
        title: {
          display: true,
          text: "Situacion Chile",
        },
      },
    },
  };

  const myChartElement = document.getElementById("myChartChile");
  var myChartModal = new Chart(myChartElement, config);
};

document
  .getElementById("SituacionChileNav")
  .addEventListener("click", async () => {
    $("#Homepage").addClass("d-none");
    $("#myChartChile").removeClass("d-none");
    $("#spinnerChileGrafico").removeClass("d-none");
    const historialCovidDataChile = await getDataChile(
      localStorage.getItem("jwt-token")
    );
    crearGraficoChile(historialCovidDataChile);
    $("#spinnerChileGrafico").addClass("d-none");
  });

document.getElementById("homePageNav").addEventListener("click", async () => {
  $("#Homepage").removeClass("d-none");
  $("#myChartChile").addClass("d-none");
});
document
  .getElementById("cerrarSesionNav")
  .addEventListener("click", async () => {
    localStorage.removeItem("jwt-token");
    location.reload();
  });
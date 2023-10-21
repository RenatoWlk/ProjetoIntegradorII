function gerarBilhete()
{
    let url = `http://localhost:3000/Bilhetes/`;

	try{
		axios.get(url)
		.then(response => {
			setCookie(response.data.codigo);
			document.location.href = "recarga.html";
		})
		.catch(error  =>  {
			if(error.response){
				const msg = new Comunicado(error.response.data.codigo, error.response.data.mensagem, error.response.data.descricao);
				alert(msg.get());
			}
		})
	}
	catch(error){
		alert(error);
	}
}

function buscarBilhete()
{
    let codigo = document.getElementById('numero_bilhete').value;
	let url = `http://localhost:3000/bilhetes/${codigo}`;

	axios.get(url)
	.then(response => {
		setCookie(response.data.codigo);
		document.location.href = "recarga.html";
	})
	.catch(error  =>  {
		if (error.response){
			const msg = new Comunicado(error.response.data.codigo, error.response.data.mensagem, error.response.data.descricao);
			alert(msg.get());
		}	
	})

	event.preventDefault()
}

function usarBilhete()
{
	let codigo = document.getElementById('input_numero_bilhete_uso').value;
	let url = `http://localhost:3000/utilizacao/${codigo}`;

	axios.get(url)
	.then(response =>{ // Mudar para mostrar o código do bilhete, e a recarga que será utilizada. 
		const msg = new Comunicado(response.data.codigo, response.data.mensagem, response.data.descricao);
		alert(msg.get());
	})
	.catch(error =>{
		if (error.response){
			const msg = new Comunicado(error.response.data.codigo, error.response.data.mensagem, error.response.data.descricao);
			alert(msg.get());
		}
	})

	event.preventDefault();
}

function recarregarBilhete(tipo)
{
	let codigo = document.cookie.split('; ').find((row) => row.startsWith('id_bilhete=')).split('=')[1];
    let url = `http://localhost:3000/Recargas/${tipo}/${codigo}`;

	try{
		axios.get(url)
		.then(response => {
			setCookie(response.data.id_bilhete, response.data.codigo_recarga, response.data.valor, response.data.data_recarga, response.data.data_uso, response.data.tipo);
			document.location.href = "recargacompleta.html";
		})
		.catch(error  =>  {
			if(error.response){
				const msg = new Comunicado(error.response.data.codigo, error.response.data.mensagem, error.response.data.descricao);
				alert(msg.get());
			}
		})
	}
	catch(error){
		alert(error);
	}

	event.preventDefault()
}

function buscarRecargas()
{
	let codigo = document.getElementById('numero_bilhete_historico').value;
	let url = `http://localhost:3000/Historico/${codigo}`;

	axios.get(url)
	.then(response => {
		montarTabela(response.data);
	})
	.catch(error => {
		deletarTabela(document.getElementById("tabela_historico_body"));
		const msg = new Comunicado(error.response.data.codigo, error.response.data.mensagem, error.response.data.descricao);
		alert(msg.get());
	})
}

function mostrarNumBilhete()
{
	try{
		var text = document.cookie.split('; ').find((row) => row.startsWith('id_bilhete=')).split('=')[1];
	}
	catch(erro)
	{
		alert("Nenhum número de bilhete registrado");
		document.location.href = "index.html";
	}

  	document.getElementById("txt_num_bilhete").innerHTML = 'O número do seu bilhete é: ' + text;
}

function mostrarInfosRecarga()
{
	try{
		var id_bilhete   = document.cookie.split('; ').find((row) => row.startsWith('id_bilhete='))    .split('=')[1];
		var cod_recarga  = document.cookie.split('; ').find((row) => row.startsWith('codigo_recarga=')).split('=')[1];
		var val_recarga  = document.cookie.split('; ').find((row) => row.startsWith('valor='))         .split('=')[1];
		var tipo_recarga = document.cookie.split('; ').find((row) => row.startsWith('tipo='))          .split('=')[1];
	}
	catch(erro)
	{
		alert("Nenhuma recarga encontrada");
		document.location.href = "index.html";
	}

	document.getElementById("li_1").innerHTML = 'NÚMERO DO BILHETE: '  + id_bilhete;
	document.getElementById("li_2").innerHTML = 'CÓDIGO DA RECARGA: '  + cod_recarga;
	document.getElementById("li_3").innerHTML = 'VALOR DA RECARGA: R$' + val_recarga + ',00';
	document.getElementById("li_4").innerHTML = 'TIPO DE RECARGA: '    + tipo_recarga;
}

function montarTabela(dados)
{
	tabela = document.getElementById("tabela_historico_body");
	deletarTabela(tabela);
	
	dados.forEach(dado => {
		let novaLinha = document.createElement("tr");
		Object.values(dado).forEach((valor) => {
			let cell = document.createElement("td");
			cell.innerText = valor;
			novaLinha.appendChild(cell);
		})
		tabela.appendChild(novaLinha);
	});
}

function deletarTabela(tabela)
{
	var child = tabela.lastElementChild;

	while(child)
	{
		tabela.removeChild(child);
		child = tabela.lastElementChild;
	}
}

function aceitarRegras()
{
	checkbox    = document.getElementById("checkbox_aceito");
	botao_gerar = document.getElementById("botao_gerar");
	if(checkbox.checked)
		botao_gerar.disabled = false;
	else
		botao_gerar.disabled = true;
}

function setCookie(id_bilhete, codigo_recarga, valor, data_recarga, data_uso, tipo) 
{    	
	if(id_bilhete){
		document.cookie = "id_bilhete=" + id_bilhete;
	}
    if(codigo_recarga){
        document.cookie = "codigo_recarga=" + codigo_recarga;
		document.cookie = "valor="          + valor;
		document.cookie = "data_recarga="   + data_recarga;
		document.cookie = "data_uso="       + data_uso;
		document.cookie = "tipo="           + tipo;
    }
}

function Comunicado(codigo,mensagem,descricao)
{
	this.codigo    = codigo;
	this.mensagem  = mensagem;
	this.descricao = descricao;
	
	this.get = function()
	{
		return(this.codigo + " - " + this.mensagem + " - " + this.descricao);
	}
}

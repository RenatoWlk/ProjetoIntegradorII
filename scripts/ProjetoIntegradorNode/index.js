function BD()
{
	process.env.ORA_SDTZ = 'UTC-3';
	
	this.getConexao = async function()
	{
		if (global.conexao)
			return global.conexao;

        const oracledb = require('oracledb');
		const dbConfig = require('../dbconfig.js');

		if(process.platform === 'win32'){
			try{
			  	oracledb.initOracleClient({libDir: 'C:/Users/user/Desktop/instantclient_21_7'});
			}catch(err){
				console.error(err);
				process.exit(1);
			}
		}
		try
        {
		    global.conexao = await oracledb.getConnection(dbConfig);
		}
		catch(erro)
		{
			console.log(erro);
			process.exit(1);
		}

		return global.conexao;
	}

	this.estrutureSe = async function()
	{
		try
		{
			const conexao = await this.getConexao();
			const sql = 'CREATE TABLE BILHETES (ID_BILHETE NUMBER(8) NOT NULL PRIMARY KEY,' + 
						'DATA_GERACAO DATE default sysdate)';
			await conexao.execute(sql);
		}
		catch (erro)
		{}
		try
		{
			const conexao = await this.getConexao();
			const sql = 'CREATE TABLE RECARGAS (CODIGO_RECARGA NUMBER NOT NULL PRIMARY KEY, ' +
						'VALOR NUMBER,' + 
						'TIPO VARCHAR2(10) NOT NULL,' +
						'DATA_RECARGA DATE default sysdate,' +
						'DATA_USO DATE,' +
						'DATA_FIM_USO DATE,' +
						'ID_BILHETE NUMBER(8) NOT NULL,' +
						'CONSTRAINT FK_RECARGA_BILHETE FOREIGN KEY (ID_BILHETE) REFERENCES BILHETES (ID_BILHETE))';
			await conexao.execute(sql);
		}
		catch (erro)
		{}
		try
		{
			const conexao = await this.getConexao();
			const sql1 = 'CREATE SEQUENCE SEQ_CODIGO_RECARGAS INCREMENT BY 1 START WITH 1 MINVALUE 1 MAXVALUE 10000000';
			await conexao.execute(sql1);
		}
		catch (erro)
		{}
	}
}

function Bilhetes(bd)
{
	this.bd = bd;

	this.gerar = async function() // INSERE UM NÚMERO NO BANCO DE DADOS PRA SER O NÚMERO DO BILHETE URBANO
	{
		const conexao = await this.bd.getConexao();

		const sql1 = "INSERT INTO BILHETES (ID_BILHETE) " + 
					 "VALUES (TO_CHAR(systimestamp, 'MISSFF3D')) ";    
		await conexao.execute(sql1);
		
		const sql2 = 'COMMIT';
		await conexao.execute(sql2);

		const sql3 = "SELECT ID_BILHETE FROM BILHETES " + 
					 "WHERE DATA_GERACAO=(SELECT max(DATA_GERACAO) from BILHETES)";
		ret = await conexao.execute(sql3);

		return ret.rows;
	}

	this.buscarBilhete = async function(codigo) // PEGA O BILHETE DIGITADO NA PAGINA DE JÁ POSSUI -> VALIDA NO BD -> PÁGINA DE RECARGAS;
	{		
		const conexao = await this.bd.getConexao();
		
		const sql = "SELECT ID_BILHETE "+
					"FROM BILHETES WHERE ID_BILHETE=:0";
		const dados = [codigo];
		ret = await conexao.execute(sql,dados);
		
		return ret.rows;
	}

	this.gerarRecarga = async function(tipo, codigo) // INSERE NO BD AS INFOS DA RECARGA ESCOLHIDA;
	{
		const conexao = await this.bd.getConexao();
		dados = [codigo];

		switch(tipo)
		{
			case 1:
				const sqltipo1 = "INSERT INTO RECARGAS (CODIGO_RECARGA, VALOR, TIPO, ID_BILHETE)" +
						 		 "VALUES(SEQ_CODIGO_RECARGAS.nextval, 1, 'UNICO', :0)";
				await conexao.execute(sqltipo1, dados);
				break;
			case 2:
				const sqltipo2 = "INSERT INTO RECARGAS (CODIGO_RECARGA, VALOR, TIPO, ID_BILHETE)" +
						 		 "VALUES(SEQ_CODIGO_RECARGAS.nextval, 2, 'DUPLO', :0)";
				await conexao.execute(sqltipo2, dados);
				break;
			case 3:
				const sqltipo3 = "INSERT INTO RECARGAS (CODIGO_RECARGA, VALOR, TIPO, ID_BILHETE)" +
						 		 "VALUES(SEQ_CODIGO_RECARGAS.nextval, 5, 'SEMANAL', :0)";
				await conexao.execute(sqltipo3, dados);
				break;
			case 4:
				const sqltipo4 = "INSERT INTO RECARGAS (CODIGO_RECARGA, VALOR, TIPO, ID_BILHETE)" +
						 		 "VALUES(SEQ_CODIGO_RECARGAS.nextval, 20, 'MENSAL', :0)";
				await conexao.execute(sqltipo4, dados);
				break;
		}

		const sql2 = 'COMMIT';
		await conexao.execute(sql2);

		const sql3 = "SELECT CODIGO_RECARGA, VALOR, TIPO, ID_BILHETE " +  // MOSTRA NA RECARGA COMPLETA AS INFOS DA RECARGA ESCOLHIDA;
					 "FROM RECARGAS " +
					 "WHERE data_recarga=(SELECT max(data_recarga) from RECARGAS)";
		ret = await conexao.execute(sql3);

		return ret.rows;
	}

	this.buscarRecarga = async function(codigo)  // MOSTRA NO HISTÓRICO AS INFOS DAS RECARGAS PASSADAS;
	{
		const conexao = await this.bd.getConexao();

		const sql = "SELECT CODIGO_RECARGA, VALOR, TO_CHAR(DATA_RECARGA, 'DD-MM-YYYY HH24:MI:SS'), TO_CHAR(DATA_USO, 'DD-MM-YYYY HH24:MI:SS'), TO_CHAR(DATA_FIM_USO, 'DD-MM-YYYY HH24:MI:SS'), TIPO " +
					"FROM RECARGAS WHERE ID_BILHETE=:0"
		const dados = [codigo];
		ret = await conexao.execute(sql, dados);

		return ret.rows;
	}

	this.recargaSendoUsada = async function(codigo)
	{
		const conexao = await this.bd.getConexao();

		dados = [codigo];
		const sql = 'SELECT CODIGO_RECARGA ' +
					'FROM RECARGAS WHERE DATA_FIM_USO > sysdate AND ID_BILHETE=:0'
		ret = await conexao.execute(sql, dados);

		return ret.rows;
	}

	this.proximaRecargaLivre = async function(codigo, tipo)
	{
		const conexao = await this.bd.getConexao();
		const dados = [codigo];

		switch(tipo){
			case 1:
				const sql1 = "SELECT CODIGO_RECARGA FROM RECARGAS " +
							 "WHERE TIPO='UNICO' AND DATA_USO IS NULL AND ID_BILHETE=:0 ";
				ret = await conexao.execute(sql1, dados);
				break;
			case 2:
				const sql2 = "SELECT CODIGO_RECARGA FROM RECARGAS " +
							 "WHERE TIPO='DUPLO' AND DATA_USO IS NULL AND ID_BILHETE=:0 ";
				ret = await conexao.execute(sql2, dados);
				break;
			case 3:
				const sql3 = "SELECT CODIGO_RECARGA FROM RECARGAS " +
							 "WHERE TIPO='SEMANAL' AND DATA_USO IS NULL AND ID_BILHETE=:0 ";
				ret = await conexao.execute(sql3, dados);
				break;
			case 4:
				const sql4 = "SELECT CODIGO_RECARGA FROM RECARGAS " +
							 "WHERE TIPO='MENSAL' AND DATA_USO IS NULL AND ID_BILHETE=:0 ";
				ret = await conexao.execute(sql4, dados);
				break;
		}

		return ret.rows;
	}
	
	this.usarRecarga = async function(codigo, tipo) // Eu preciso receber o tipo da recarga (única, dupla..) pra poder alterar no banco de dados se ela esgotou ou não.
	{
		const conexao = await this.bd.getConexao();
		const dados = [codigo];

		switch(tipo)
		{
			case 1:
				const sqlUso1 = "UPDATE RECARGAS SET DATA_USO=sysdate, DATA_FIM_USO=sysdate+(2/3)/24 " +
								"WHERE codigo_recarga=:0";
				await conexao.execute(sqlUso1, dados);
				break;
			case 2:
				const sqlUso2 = "UPDATE RECARGAS SET DATA_USO=sysdate, DATA_FIM_USO=sysdate+(4/3)/24 " +
								"WHERE codigo_recarga=:0";
				await conexao.execute(sqlUso2, dados);
				break;	
			case 3:
				const sqlUso3 = "UPDATE RECARGAS SET DATA_USO=sysdate, DATA_FIM_USO=sysdate+7 " +
								"WHERE codigo_recarga=:0";
				await conexao.execute(sqlUso3, dados);
				break;
			case 4:
				const sqlUso4 = "UPDATE RECARGAS SET DATA_USO=sysdate, DATA_FIM_USO=sysdate+30 " +
								"WHERE codigo_recarga=:0";
				await conexao.execute(sqlUso4, dados);
				break;
		}
		

		const sql2 = 'COMMIT';
		await conexao.execute(sql2);
	}

}

function Bilhete(codigo,data_geracao)
{
	this.codigo 	  = codigo;
	this.data_geracao = data_geracao;
}

function RecargaCompleta(codigo_recarga, valor, tipo, id_bilhete)
{
	this.codigo_recarga = codigo_recarga;
	this.valor 			= valor;
	this.tipo 			= tipo;
	this.id_bilhete 	= id_bilhete;
}

function RecargaHistorico(codigo_recarga, valor, data_recarga, data_uso, data_fim_uso, tipo)
{
	this.codigo_recarga = codigo_recarga;
	this.valor 			= valor;
	this.data_recarga	= data_recarga;
	this.data_uso 		= data_uso;
	this.data_fim_uso   = data_fim_uso;
	this.tipo 			= tipo;
}

function Comunicado(codigo,mensagem,descricao)
{
	this.codigo 	= codigo;
	this.mensagem 	= mensagem;
	this.descricao 	= descricao;
}

function middleWareGlobal(req, res, next)
{
    console.time('Requisição'); // marca o início da requisição
    console.log('Método: '+req.method+' | URL: '+req.url); // retorna qual o método e url foi chamada

    next(); // função que chama as próximas ações

    console.log('Finalizou'); // será chamado após a requisição ser concluída

    console.timeEnd('Requisição'); // marca o fim da requisição
	console.log('');
}

async function geracao(req, res)
{
	try{
		ret = await global.bilhetes.gerar(Bilhete);
		ret = new Bilhete(ret[0],ret[1]);
		return res.status(200).json(ret);
	}
	catch(erro){
		console.log(erro);
		const erro2 = new Comunicado ('BNG', 'Erro', 'Não foi possível gerar o bilhete');
		return res.status(409).json(erro2);
	}
}

async function buscarUmBilhete(req, res)
{
	const codigo = req.params.codigo;
    
    let ret;
	try
	{
	    ret = await global.bilhetes.buscarBilhete(codigo);
	}    
    catch(erro)
    { console.log(erro); }

	if (ret !== undefined)
	{
		if (ret.length==0)
		{
			const erro2 = new Comunicado('BNE', 'Bilhete inexistente', 'Não há bilhete cadastrado com o código informado');
			return res.status(404).json(erro2);
		}
		else
		{
			ret = ret[0];
			ret = new Bilhete(ret[0],ret[1]);
			return res.status(200).json(ret);
		}
	}
	else
	{
		const erro = new Comunicado('BNE', 'Bilhete inexistente', 'Não há bilhete cadastrado com o código informado');
		return res.status(404).json(erro);
	}
}

async function recarregarBilhete(req, res)
{
	const tipo 	 = parseInt(req.params.tipo);
	const codigo = parseInt(req.params.codigo);
	let ret;

	ret = await global.bilhetes.gerarRecarga(tipo, codigo);
	ret = ret[0];
	ret = new RecargaCompleta(ret[0],ret[1],ret[2],ret[3]);
	
	return res.status(200).json(ret);
}

async function buscarRecargas(req, res)
{
	const codigo = req.params.codigo;

	let rec;
	try
	{
		rec = await global.bilhetes.buscarRecarga(codigo);
	}
	catch(erro)
	{ console.log(erro); }

	if(rec != undefined)
	{
		if(rec.length==0)
		{
			return res.status(200).json([]);
		}
		else
		{
			const ret=[];
			for(i = 0; i < rec.length; i++)
			{
				ret.push(new RecargaHistorico(rec[i][0],rec[i][1],rec[i][2],rec[i][3],rec[i][4],rec[i][5]));
			}
			return res.status(200).json(ret);
		}
	}
	else
	{
		const erro = new Comunicado('BNE', 'Bilhete inexistente', 'Não há bilhete cadastrado com o código informado');
		return res.status(404).json(erro);
	}
}

async function usarRecarga(req, res)
{
	const codigo = parseInt(req.params.codigo);

	//Primeiro verifica se há alguma recarga ativa, se tiver retorna que a recarga foi usada
	const validacao = await global.bilhetes.recargaSendoUsada(codigo);
	if(validacao.length != 0)
	{
		const sucesso = new Comunicado('RUS', 'Usado com sucesso', 'Uma recarga foi utilizada com sucesso');
		return res.status(200).json(sucesso);
	}
	
	//Segundo vai procurando qual a próxima recarga livre através de um for, se tiver para e segue, se não fica undefined
	let ret;
	let tipo;
	for(tipo=4;tipo>0;tipo--)
	{
		ret = await global.bilhetes.proximaRecargaLivre(codigo, tipo);

		if(ret != 0)
		{
			break;
		}
	}

	//Terceiro usa a recarga nova se não for undefined
	try{
		ret = ret[0];
		ret = ret[0];

		await global.bilhetes.usarRecarga(ret, tipo);
		const sucesso = new Comunicado('NRU', 'Usado com sucesso', 'Uma nova recarga foi utilizada com sucesso');
		return res.status(200).json(sucesso);
	}
	catch(erro)
	{
		const erro2 = new Comunicado('NHR', 'Não há recargas', 'O bilhete passado não possui recargas disponíveis');
		return res.status(404).json(erro2);
	}
}

async function ativacaoDoServidor()
{
    const bd = new BD();
    await bd.estrutureSe();
    global.bilhetes = new Bilhetes(bd);

    const express = require('express');
	const app     = express();
	const cors    = require('cors');

	const path = require('path');
	const pastaScripts = path.join(__dirname,'../');
	const pastaProjeto = path.join(pastaScripts,'../');

    app.use(express.json()); //faz com que o express consiga processar JSON
    //app.use(middleWareGlobal);
	app.use(cors()); //habilitando cors na nossa aplicacao (adicionar essa lib como um middleware da nossa API - todas as requisições passarão antes por essa biblioteca).
	
	app.use(express.static(pastaProjeto + '/estilos'));
	app.use(express.static(pastaProjeto + '/imagens'));
	app.use(express.static(pastaProjeto + '/scripts'));

	app.get("/index.html",           function(req,res){res.sendFile(pastaProjeto + "/view/index.html")});
	app.get("/japossui.html",        function(req,res){res.sendFile(pastaProjeto + "/view/japossui.html")});
	app.get("/recarga.html",         function(req,res){res.sendFile(pastaProjeto + "/view/recarga.html")});
	app.get("/recargacompleta.html", function(req,res){res.sendFile(pastaProjeto + "/view/recargacompleta.html")});
	app.get("/historico.html",       function(req,res){res.sendFile(pastaProjeto + "/view/historico.html")});
	app.get("/utilizacao.html",      function(req,res){res.sendFile(pastaProjeto + "/view/utilizacao.html")});

    app.get('/bilhetes', geracao);
    app.get('/bilhetes/:codigo', buscarUmBilhete); 
	app.get('/recargas/:tipo/:codigo', recarregarBilhete);
	app.get('/historico/:codigo', buscarRecargas);
	app.get('/utilizacao/:codigo', usarRecarga);

    console.log('Servidor ativo na porta 3000...'+'\n');
    app.listen(3000);
}

ativacaoDoServidor();
const { Aluno, UsuarioVideo, UsuarioTopico,UsuarioModulo} = require("../models");
const express = require("express");
const router = express.Router();
const gradeService = require("../Services/gradeService");
const userService = require("../Services/userService");
const videosService = require("../Services/videosService");
const moduloService = require("../Services/moduloService");
const topicoService = require("../Services/topicoService");
const saibaMaisService = require("../Services/saibaMaisService");
const { where } = require("sequelize");
const { getInfoTopicos } = require("../Services/topicoService")
const referenciasService = require("../Services/referenciasService")
const { enviarMensagemParaAgente } = require('../Services/agenteIA');


router.post("/gradein", async (req, res) => {
  try {
    console.log("Grade in");
    console.log(req.body)
    const idtoken = res.locals.token; // IdToken
    if (!idtoken) {
      return res.status(400).send({ error: "Token inválido" });
    }

    const score = req.body.grade; // Nota do usuário
    if (typeof score !== "number" || score < 0) {
      return res.status(400).json({ error: "Nota inválida" });
    }

    const ltik = res.locals.ltik; // Pega o ltik do usuário

    const responseGrade = await gradeService.submitGrade(
      idtoken,
      score,
      ltik,
      "InProgress",
      "FullyGraded"
    );
    console.log(responseGrade);
    const dados_user_atualizado = await userService.getDadosUser(ltik);

    return res.status(200).json(dados_user_atualizado);
  } catch (err) {
    console.log(err);
    console.error("Erro no processo: ", err.message);
    return res.status(500).send({ error: err.message });
  }
});

router.post("/grade", async (req, res) => {
  try {
    const idtoken = res.locals.token; // IdToken
    if (!idtoken) {
      return res.status(400).send({ error: "Token inválido" });
    }

    const score = req.body.grade; // Nota do usuário
    if (typeof score !== "number" || score < 0) {
      return res.status(400).json({ error: "Nota inválida" });
    }

    const ltik = res.locals.ltik; // Pega o ltik do usuário

    const responseGrade = await gradeService.submitGrade(
      idtoken,
      score,
      ltik,
      "Completed",
      "FullyGraded"
    );
    const dados_user_atualizado = await userService.getDadosUser(ltik);

    return res.status(200).json(dados_user_atualizado);
  } catch (err) {
    console.error("Erro no processo: ", err.message);
    return res.status(500).send({ error: err.message });
  }
});

router.post("/api/liberar", async (req, res) => {
  console.log("Entrei no liberar");
  try {
    const id_topico = req.body.idTopico;
    const ltik = req.body.token; // Pega o ltik do usuário
    const dados_user_atualizado = await userService.getDadosUser(ltik);
    const liberar = await videosService.liberarProximoVideo(
      id_topico,
      req.body.token
    );
    console.log(liberar);
    if (liberar) {
      return res.status(200).json(dados_user_atualizado);
    }
  } catch (error) {
    console.log("Erro: ", error);
  }
});
// Função para obter informações do usuário
router.get("/userInfo", async (req, res) => {
  try {
    const ltik = res.locals.ltik;
    let dados_user = await userService.getDadosUser(ltik);
    if (dados_user == null) {
      return res.status(500).json("Erro ao puxar os dados do usuario");
    }

    return res.status(200).json(dados_user);
  } catch (err) {
    console.error("Erro ao obter informações do usuário:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/moduloInfo", async (req, res) => {
  try {
    const ltik = res.locals.ltik;
    let dados_modulo = await moduloService.getInfoModuloWithUser(ltik);
    if (dados_modulo == null){
      return res.status(500).json("Erro ao puxar os dados do módulo");
    }
    return res.status(200).json(dados_modulo);
  } catch (err) {
    console.error("Erro ao obter informações do módulo:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
})

router.get("/topicosInfo", async (req, res)=> {
  try {
    const ltik = res.locals.ltik;
    const id_modulo = req.query.id_modulo;
    const id_aluno = req.query.id_aluno;
    

    const infoTopicos = await getInfoTopicos(id_modulo, id_aluno, ltik)
    return res.status(200).json(infoTopicos);

  } catch (error) {
    console.error('Erro ao buscar informações do tópico', error)
     return res.status(500).json({ error: "Erro interno do servidor" });
  }
} )

router.get("/userTopicoInfo", async (req, res) => {
  try {
    const ltik = res.locals.ltik;
    const id_modulo = req.query.id_modulo;
    const id_aluno = req.query.id_aluno;
    const control_topico = req.query.control_topico;
    let userTopico = await topicoService.getUserTopico(id_modulo, id_aluno, ltik, control_topico);
    console.log(userTopico)
    return res.status(200).json(userTopico);
  } catch (error) {
    console.error('Erro ao buscar dados userTópico', error)
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
})

router.post("/finalizar-video", async (req, res) => {
  const { ltiUserId, videoId, ltik } = req.body;
  console.log(req.body);
  const user = await Aluno.findOne({ where: { ltik } });

  try {
    // Atualizar a entrada na tabela UsuarioVideo, marcando como completo
    await UsuarioVideo.update(
      { completo: true },
      { where: { id_aluno: user.id_aluno, id_video: videoId } }
    );

    // Retorna os dados do usuário atualizados
    const dados_user_atualizado = await userService.getDadosUser(ltik);

    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.error("Erro ao finalizar vídeo:", error);
    return res.status(500).json({ message: "Erro ao finalizar vídeo" });
  }
});

router.post("/salvar-progresso-video", async (req, res) => {
  const { id_video, ltik, id_topico } = req.body;
  console.log(req.body);
  const user = await Aluno.findOne({ where: { ltik } });

  try {
    await UsuarioTopico.update(
      { indice_video: id_video },
      { where: { id_aluno: user.id_aluno, id_topico: id_topico } }
    );

    // Retorna os dados do usuário atualizados
    const dados_user_atualizado = await userService.getDadosUser(ltik);

    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.error("Erro ao finalizar vídeo:", error);
    return res.status(500).json({ message: "Erro ao finalizar vídeo" });
  }
});

router.post("/resposta-errada", async (req, res) => {
  const { idTopico, ltik, respostaErrada } = req.body;
  console.log(req.body);
  const user = await Aluno.findOne({ where: { ltik } });

  try {
    await UsuarioTopico.update(
      { resposta_errada: respostaErrada },
      { where: { id_aluno: user.id_aluno, id_topico: idTopico } }
    );

    const dados_user_atualizado = await userService.getDadosUser(ltik);

    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.error("Erro ao cadastrar resposta errada:", error);
    return res
      .status(500)
      .json({ message: "Erro ao cadastrar resposta errada" });
  }
});

router.post("/resposta-errada-refazer", async (req, res) => {
  const { idTopico, ltik } = req.body;
  console.log(req.body);
  const user = await Aluno.findOne({ where: { ltik } });

  try {
    await UsuarioTopico.update(
      { resposta_errada: null },
      { where: { id_aluno: user.id_aluno, id_topico: idTopico } }
    );

    const dados_user_atualizado = await userService.getDadosUser(ltik);

    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.error("Erro ao resetar a resposta errada:", error);
    return res
      .status(500)
      .json({ message: "Erro ao resetar a resposta errada" });
  }
});

router.post("/finalizaSaibaMais", async (req, res) => {
  const { idTopico, ltik } = req.body;
  console.log(req.body);
  const user = await Aluno.findOne({ where: { ltik } });

  try {
    await UsuarioTopico.update(
      { isSaibaMais: true },
      { where: { id_aluno: user.id_aluno, id_topico: idTopico } }
    );

     const dados_user_atualizado = await userService.getDadosUser(ltik)
  
    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.error("Erro ao marcar como visto o saiba mais do topico:", error);
    return res
      .status(500)
      .json({ message: "Erro ao marcar como visto o saiba mais do topico:" });
  }
});

router.post("/finalizaTextoApoio", async (req, res) => {
  const { idTopico, ltik } = req.body;
  console.log(req.body);
  const user = await Aluno.findOne({ where: { ltik } });

  try {
    await UsuarioTopico.update(
      { isTextoApoio: true },
      { where: { id_aluno: user.id_aluno, id_topico: idTopico } }
    );

    const dados_user_atualizado = await userService.getDadosUser(ltik)
  
    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.error(
      "Erro ao marcar como visto o Texto de apoio do topico:",
      error
    );
    return res.status(500).json({
      message: "Erro ao marcar como visto o Texto de apoio do topico",
    });
  }
});

router.post("/finalizaReferencias", async (req, res) => {
  const { idTopico, ltik } = req.body;
  console.log(req.body);
  const user = await Aluno.findOne({ where: { ltik } });

  try {
    await UsuarioTopico.update(
      { isReferencias: true },
      { where: { id_aluno: user.id_aluno, id_topico: idTopico } }
    );

    const dados_user_atualizado = await userService.getDadosUser(ltik)
  
    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.error("Erro ao marcar como visto a Referencias do topico:", error);
    return res
      .status(500)
      .json({ message: "Erro ao marcar como visto a Referencias do topico" });
  }
});
//! Testar
router.post("/enviar_avaliacao", async (req, res) => {
  const { id_user_modulo, avaliacao, comentario, ltik } = req.body;
  console.log(req.body);

  const user = await UsuarioModulo.findOne({ where: { id : id_user_modulo } });

  try {
    if (user) {
      await UsuarioModulo.update(
        { avaliacao: avaliacao, comentario: comentario },
        { where: { id : id_user_modulo } }
      );
  
      const dados_user_atualizado = await userService.getDadosUser(ltik);
  
      return res.status(200).json(dados_user_atualizado);
    }else{
      return res.json({error:"Falha ao encontrar o UsuarioModulo Id"});
    }

  } catch (error) {
    console.error("Erro ao tentar salvar a nota de avaliação do modulo:", error);
    return res
      .status(500)
      .json({ message: `Erro ao tentar salvar a nota de avaliação do modulo: ${error}`});
  }
});

router.post("/api/salvarAvaliacaoIA", async (req, res) => {
  console.log("Entrei no salvarAvaliacaoIA");

  try {
    const {
      idTopico,
      token,
      respostaAluno,
      nota,
      justificativa,
      teto,
    } = req.body;

    const aluno = await Aluno.findOne({ where: { ltik: token } });

    if (!aluno) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }

    const userTopico = await UsuarioTopico.findOne({
      where: {
        id_aluno: aluno.id_aluno,
        id_topico: idTopico,
      },
    });

    if (!userTopico) {
      return res
        .status(404)
        .json({ message: "Relação aluno-topico não encontrada" });
    }

    await userTopico.update({
      resposta_aberta_aluno: respostaAluno,
      resposta_aberta_nota_IA: nota,
      resposta_aberta_justificativa_IA: justificativa,
      resposta_aberta_teto: teto,
      encerrado: 1,
    });

    // Atualiza e retorna o usuário com progresso atualizado
    const dados_user_atualizado = await userService.getDadosUser(token);
    return res.status(200).json(dados_user_atualizado);
  } catch (error) {
    console.log("Erro ao salvar avaliação IA: ", error);
    res.status(500).json({ message: "Erro ao salvar avaliação da IA" });
  }
});


router.get("/videosUrl", async (req, res)=> {
  try {
    const ltik = res.locals.ltik;
    const id_modulo = req.query.id_modulo;
    const videosUrl = await videosService.getVideosUrlsByIdModulo(id_modulo, ltik);
    return res.status(200).json(videosUrl)
  } catch (error) {
    console.error("Erro ao buscar videos do tópico!", error)
    return res.status(500).json({ message: "Erro interno no servidor"})
  }
})

router.get("/saibaMais", async (req, res)=> {
  try {
    const ltik = res.locals.ltik;
    const id_topico = req.query.id_topico;
    const saibaMais = await saibaMaisService.getSaibaMais(ltik, id_topico);
    return res.status(200).json(saibaMais)
  } catch (error) {
    console.error("Erro ao buscar saiba mais do tópico!", error)
    return res.status(500).json({ message: "Erro interno no servidor"})
  }
})


router.get("/referencias", async (req, res)=> {
  try {
    const ltik = res.locals.ltik;
    const referencias = await referenciasService.getReferencias(ltik)
    return res.status(200).json(referencias)
  } catch (error) {
    console.error("Erro ao buscar referencias!", error)
    return res.status(500).json({ message: "Erro interno no servidor"})
  }
})


router.post("/enviar-mensagem-agente", async(req, res) => {
    try {
        const { mensagem, nomeModulo, idModulo, sessionId } = req.body;
        
        if (!mensagem || !nomeModulo || !idModulo || !sessionId)  {
            return res.status(400).json({error: 'Parâmetros necessários estão ausentes!'});
        }

        const dados = await enviarMensagemParaAgente(mensagem, nomeModulo ,idModulo, sessionId);

        if (!dados) return res.status(400).json({ error: 'Erro ao fazer enviar mensagem para o Agente de IA'})

        return res.status(200).json({ message: 'Mensagem enviada com sucesso', dados })

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Erro ao enviar mensagem para o agente de IA'});
    }
})



module.exports = router;

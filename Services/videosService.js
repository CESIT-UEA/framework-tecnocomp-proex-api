const {
  UsuarioModulo,
  UsuarioVideo,
  Modulo,
  Topico,
  UsuarioTopico,
  VideoUrls,
  SaibaMais,
  Referencias,
  Exercicios,
  Alternativas,
  Aluno,
} = require("../models");
const { where } = require("sequelize");
const lti = require("ltijs").Provider;
const topicoService = require('../Services/topicoService');
const topico = require("../models/topico");

async function liberarProximoVideo(id_topico, ltik) {
  const user = await Aluno.findOne({ where: { ltik: ltik } });
  if (user) {
    const userTopico = await UsuarioTopico.findOne({
      where: { id_aluno: user.id_aluno, id_topico: id_topico },
    });
    if (userTopico) {
      userTopico.update({ encerrado: 1 });
      return userTopico;
    } else {
      throw new Error("Usuario cadastrado no modulo não encontrado");
    }
  } else {
    throw new Error("Usuario não encontrado");
  }
}

async function getVideosUrlsByIdModulo(id_modulo, ltik){
  try {
    if (!id_modulo || !ltik) throw new Error('Parâmetros obrigatórios não passados!')
      
    const user = await Aluno.findOne({ where: { ltik }})

    const topicos = await Topico.findAll({
    where: { id_modulo: id_modulo }, 
    include: [
      {
        model: VideoUrls,
        required: true,
        include: [
          {
            model: UsuarioVideo,
            where: { id_aluno: user.id_aluno },
            required: false
          }
        ]
      }
    ]
  })

    return topicos

  } catch (error) {
    console.error(error)
  }
}

module.exports = { liberarProximoVideo, getVideosUrlsByIdModulo };

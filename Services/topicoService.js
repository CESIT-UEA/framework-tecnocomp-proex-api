const { where } = require("sequelize");
const {
  Topico,
  UsuarioTopico,
  Aluno
} = require("../models");

async function getUserTopico(id_modulo, id_aluno, ltik, control_topico){
    try {
      if (!id_modulo || !id_aluno || !ltik) throw new Error(' Parâmetros obrigatórios ausentes!')
      const query = control_topico || 1;
    
      const userTopico = await Topico.findAll({
        include: [
          {
            model: UsuarioTopico,
            required: true,
            include: [
              {
                model: Aluno,
                required: true,
                where: {
                  id_aluno: id_aluno,
                  ltik: ltik
                },
              },
            ],
          },
        ],
        where: {
          id_modulo: id_modulo,
        },
      });
      if (!userTopico) throw new Error('Erro ao buscar informações do usuários tópico pelo id do módulo');
      return userTopico
    } catch (error) {
        console.log('Erro ao buscar informações do usuários tópico pelo id do módulo', error)
    }
}



async function getInfoTopicos(id_modulo, id_aluno, ltik){
    try {
      if (!id_modulo || !id_aluno || !ltik) throw new Error(' Parâmetros obrigatórios ausentes!');
        let infoTopicos = await Topico.findAll({
          attributes: ['nome_topico'],
          where: { id_modulo },
          include: [
            {
              attributes: ['encerrado'],
              model: UsuarioTopico,
              required: true,
              include: [
                {
                  model: Aluno,
                  attributes: [],
                  required: true,
                  where: {
                    id_aluno: id_aluno,
                    ltik: ltik
                  },
                },
              ],
            },
          ]
        })     
    
    infoTopicos = infoTopicos.map(topico => ({
      nome_topico: topico.nome_topico,
      encerrado: topico.UsuarioTopicos.map(ut => ut.encerrado)
    }))
    console.log(infoTopicos)
    return infoTopicos
    } catch (error) {
      console.error('Erro ao buscar informações dos tópicos', error)
    }
}


module.exports = {
    getUserTopico,
    getInfoTopicos
}
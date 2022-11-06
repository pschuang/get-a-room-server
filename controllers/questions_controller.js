require('dotenv').config

const getQuestions = async (req, res) => {
  const questions = [
    {
      userId: 3,
      roomId: '5566',
      nickname: 'Japopo',
      pictureURL: 'https://pschuang.github.io/images/capybara.svg',
    },
    {
      userId: 4,
      roomId: '5678',
      nickname: 'Shiela',
      pictureURL:
        'https://i.pinimg.com/736x/e1/ad/40/e1ad406c381e4788ef6851e95d677afc.jpg',
    },
    {
      userId: 5,
      roomId: '5566',
      nickname: 'Ramona',
      pictureURL: 'https://avatars.githubusercontent.com/u/105725219?v=4',
    },
  ]

  res.json({ questions })
}

const getQuestionsDetails = (req, res) => {
  const { questionId } = req.query
  console.log(questionId)
  const questionsDetails = {
    content: '你喜歡哪一家珍奶?',
    repliers: [
      {
        userId: 1,
        isFriend: false,
        roomId: null,
        answer: '五十嵐 ...',
        nickname: 'user 1',
        pictureURL: 'https://avatars.githubusercontent.com/u/105725219?v=4',
      },
      {
        userId: 2,
        isFriend: false,
        roomId: null,
        answer: '珍煮丹...',
        nickname: 'user 2',
        pictureURL: 'https://avatars.githubusercontent.com/u/105725219?v=4',
      },
      {
        userId: 3,
        isFriend: true,
        roomId: '1234',
        answer: '一沐日...',
        nickname: 'user 3',
        pictureURL: 'https://avatars.githubusercontent.com/u/105725219?v=4',
      },
    ],
  }
  res.json(questionsDetails)
}

module.exports = { getQuestions, getQuestionsDetails }

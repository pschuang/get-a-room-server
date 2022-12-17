
<a href="https://get-a-room.online">
  <img src="https://get-a-room.online/get-a-room.svg" width="360px" />
</a>


## 📖 Table of contents

- [Summary](#🌐-Summary)
- [Introduction](#📂-Introduction)
- [User Flow](#🔸-User-Flow)
- [Features](#🎨-Features)
- [Tech Stack](#🤖-Tech-Stack)
- [Table Schema](#🔍-Table-Schema)
- [Architecture Diagram](#🔹-Architecture-Diagram)
- [Demo](#✨-Demo)
- [Sprint Timeline](#🏃-Sprint-Timeline)
- [Future Plans](#🚀-Future-Plans)

## 🌐 Summary

This is a matchmaking website hosted on AWS EC2, built with Node.js and Express as the backend framework, React as the frontend, MySQL and Redis as the databases. We use Websockets for real-time chat and dayjs and crontab for managing time logic behind the scenes.

- [Back-End Repository](https://github.com/pschuang/get-a-room-server)
- [Front-End Repository](https://github.com/pschuang/get-a-room-client)

## 📂 Introduction

### Synopsis

A matchmaking platform based on an anonymous question-answer game, which brings a quality time of 15 minutes everyday for users to get to know a new friend starting from a specific topic.

### What brought me this idea?

Social media and dating apps have evolved to become platforms for people to meet up, and finding matches with people online has become much easier in recent years. **"Dating app fatigue"** refers to people using dating app get overwhelmed by the sheer number of potential matches, leading them to lose focus and become unable to commit to any one person.

![](https://i.imgur.com/ZP92YwM.png)


As a result, I came up with this idea of creating a platform where people can **match only once a day**. Moreover, A match happens when a user who post the question picks a reply from another user, and then both can start a chatroom with time limit. 

With this design, I want to create connections between users based on topics that interest them, and build a place where users can focus on talking to a person per day.





## 🔸 User Flow
#### Playground rule
<div style="text-align:center">
    <img src="https://i.imgur.com/5IlWk25.png" width="50%"  />
</div>
<br/>

```
1. Bulletin open for 20 mins, once a day.
2. You can post 1 question and reply to multiple questions everyday.
3. Pick a reply. If the replier is online, they will get notified.
4. Once matched, you can chat with counterpart for 15 mins.
5. When match ends, both users can decide whether to be friends in 30 seconds.
6. You can chat with your friends whenever you want.
7. Either by picking a replier or getting picked, you can only be matched once per day.
```

:::info
**Notice:** For viewers to better understand the project, bulletin now is open from 10:00 a.m. to 10:00 p.m.
:::
#### Go meet a friend!

Please feel free to play with the test acount, or sign up for yourself via [GET A ROOM signup page](https://get-a-room.online/signup)

```
-- test account --
email: test1@test.com
password: @Test1234
```



## 🎨 Features

### Questions

- Category Filter & Search
- Load more to view more questions
- Post questions
- Reply to questions
- Limit of 1 question post by each user per day

![](https://i.imgur.com/BnLqln1.png)




### Chatroom

#### <ins>In general</ins>

- Real-time chat between two users by`Socket.IO`
- Show messages with time


#### <ins>Chatroom with friends</ins>

- Store chat history
- Show friends' online | offline status

![](https://i.imgur.com/LWHNQal.png)


#### <ins>Temporary chatroom with matched counterpart</ins>

- Notify users when counterpart joins / leaves chatroom
- Counting down timer starts right after replier joined chatroom
- When time's up, both users will be asked if they want to be friends or not

### Bulletin Time Limit
Use `Day.js` to deal with dates and times and measure time in <i>UTC</i>

- Build a middleware to block request not within the bulletin open time.
- Show questions created on the same day
- Randomly generate bulletin open time everyday by`Crontab`

（Bulletin Page 圖 - 未開放版）

### Matching Mechanism

Use `Redis` for real-time data analysis
- Users can view their questions and pick a replier to go to chat.
- Only online users can be picked
- Users can only be matched once per day
- Once matched, both users enter a chatroom open for 15 minutes.
- When time's up and if both agree, both become friends.

（ChatRoom Page - 好友彈窗畫面）

### Dashboard
Implement dashboard's real-time data display by `Socket.IO`

- Demonstrate data for monitoring the website
    - Instant data：Online user counts, matching situation
    - Statistics for the day (refreshed constantly)： New register counts, question counts, percentage of question categories, closed question counts, reply counts, new friendship counts
    - Weekly statistics：Page views per day, question total counts per day
- Authorization: Only users assigned admin role can get access to dashboard
- Charts (Doughnut Chart, Line Chart, Bar Chart) are created with `Chart.js`
- Updates page views on hourly basis by `Crontab`

### Sign in / Sign up
Use `JSON Web Token` for authentication 

## 🔹 Architecture Diagram

- Configures Nginx as reverse proxy to handle incoming requests
- Uses Express as backend framework, React as frontend
- Leverages MySQL to store and retrieve data to provide API service 
- Enables real-time, bidirectional and event-based communication between client and server with Websocket
- Utilize Redis to store disposable data in memory with expiration time, in order to reduce burden on MySQL

![](https://i.imgur.com/eS5AMSR.png)

## 🤖 Tech Stack

![](https://i.imgur.com/VhSjTrp.png)

#### Server
Node.js / Express / Nginx / <span>Socket.IO</span> 


#### Client
React / <span>Socket.IO</span> / Chart.js


#### DataBase
MySQL / Redis


#### Cloud Services
AWS EC2 / AWS RDS / AWS ElastiCache

#### Test
Jest

#### Scheduler
Crontab



## 🔍 Table Schema
![](https://i.imgur.com/VfIykna.png)




## ✨ Demo
#### Post question / refresh bulletin / filter / load more
![](https://i.imgur.com/JhbBdV9.gif)








## 🏃 Sprint Timeline
The project was completed in 5 weeks, with each week representing a sprint.

| Sprint | Goals | Completed Tasks |
|--------|-------|-----------------|
| 1 | Complete the POC for the real-time chat room | Research Socket and React, implement the POC |
| 2 | Develop the user interfaces and bulletin page | Implement sign-in and sign-up authentication, create and reply to questions, keyword filtering and searching |
| 3 | Implement the friends chat room and match mechanism | Develop and test the friends chat room and match mechanism, implement time validation and bulletin open limit and countdown |
| 4 | Create the admin dashboard and deploy the app | Design and implement the admin dashboard, set up cloud environment and deploy the website |
| 5 | Refactor the server project and perform testing | Refactor the server code, conduct testing 

## 🚀 Future Plans
- Stateless server
- Extra chatroom features
- Question recommendation
- Add geolocation technology to matching mechanism
import nodemailer from 'nodemailer';

const mailSender = async (email, title, body)=>{
    try {
        let transporter = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                }
        }) 
        await transporter.sendMail({
            from: process.env.MAIL_SENDER,
            to:`${email}`,
                subject: `${title}`,
                html: `${body}`,
        })

    } catch (error) {
        throw(error);
    }
}

export {mailSender};
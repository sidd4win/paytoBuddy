const express=require("express");

const userRouter=require("./user");
const accountRouter = require('./account'); 
const adminRouter = require('./admin');
const router=express.Router();


router.use("/user",userRouter);
router.use('/account', accountRouter);
router.use('/admin', adminRouter);
module.exports=router;

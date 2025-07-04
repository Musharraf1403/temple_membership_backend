const express = require('express');
const Membership = require('../models/Membership');
const sendEmail = require('../utils/sendEmail');
const _ = require('lodash');
const { PDFDocument, rgb } = require('pdf-lib');

exports.createMembership = async (req, res) => {
    try {
        let member = await Membership.findOne({
            $or: [
                {
                    phone: req.body.phone
                },
                {
                    email: req.body.email
                }
            ]
        });
        if (member)
            return res.status(400).json({ message: "Member with same email or phone number already exists!" });
        let membersCount = await Membership.countDocuments();
        let membership = new Membership({
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            membership_id: membersCount + 1,
            function_date: req.body.function_date,
            pincode: req.body.pincode,
            package_plan: req.body.package_plan,
            package_price: req.body.package_price
        });
        if (membership) {
            let subject = "Temple Membership Joining";
            const emailContent = `Hello ${req.body.name},\nPlease pay the amount to the following account:\nAccount Details: XYZ`;
            await sendEmail(req.body.email, subject, emailContent);
            await membership.save();
            res.status(200).json({ message: "Mail sent to the given mail id." });
        } else {
            res.status(400).json({ message: "Not able to create membership" });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.updateMembership = async (req, res) => {
    try {
        let member = await Membership.findOne({ _id: req.params.id });
        if (member) {
            let approveMessage = `Dear ${member.name},\n\nAttached is your membership ID card!.\n`;
            let cancelMessage = `Dear ${member.name},\n\nYour Membership got cancelled!.\n`;
            if (member.approved != req.body.approved) {
                if (req.body.approved) {
                    member.approval_date = new Date().toISOString();
                    member.expiry_date = new Date(new Date().setDate(new Date().getDate() + 365)).toISOString();
                    let idCard = await generateMembershipIdCard(member);
                    let attachments = [
                        {
                            filename: 'Membership_ID_Card.pdf',
                            content: idCard,
                            contentType: 'application/pdf',
                        },
                    ];
                    await sendEmail(member.email, "Your Membership ID card", approveMessage, attachments)
                } else {
                    member.expiry_date = new Date();
                    await sendEmail(member.email, "Membership Cancelled!", cancelMessage)
                }
            }
            member.name = req.body.name;
            member.email = req.body.email;
            member.address = req.body.address;
            member.phone = req.body.phone;
            member.transaction_details = req.body.transaction_details;
            member.payment_mode = req.body.payment_mode;
            member.approved = req.body.approved;
            member.function_date = req.body.function_date;
            member.pincode = req.body.pincode;
            member.package_plan = req.body.package_plan;
            member.package_price = req.body.package_price;
            member.save();
            return res.status(200).json({ message: req.body.approved ? "Membership approved!" : "Membership cancelled!" });
        } else {
            res.status(400).json({ message: "Member not found!" });
        }
        if (member)
            return res.status(200).json({ message: "Membership updated!" });
        return res.status(500).json({ message: "Not able to update member!" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

exports.manageMembership = async (req, res) => {
    try {
        let member = await Membership.findOne({ _id: req.params.id });
        if (member) {
            member.approved = req.body.approved;
            let approveMessage = `Dear ${member.name},\n\nAttached is your membership ID card!.\n`;
            let cancelMessage = `Dear ${member.name},\n\nYour Membership got cancelled!.\n`;
            if (req.body.approved) {
                member.approval_date = new Date().toISOString();
                if (member.package_plan === 'yearly')
                    member.expiry_date = new Date(new Date().setDate(new Date().getDate() + 365)).toISOString();
                else
                    member.expiry_date = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
                member.payment_mode = req.body.payment_mode;
                member.transaction_details = req.body.transaction_details;
                let idCard = await generateMembershipIdCard(member);
                let attachments = [
                    {
                        filename: 'Membership_ID_Card.pdf',
                        content: idCard,
                        contentType: 'application/pdf',
                    },
                ];
                await sendEmail(member.email, "Your Membership ID card", approveMessage, attachments)
            } else {
                member.expiry_date = new Date();
                await sendEmail(member.email, "Membership Cancelled!", cancelMessage)
            }
            member.save();
            return res.status(200).json({ message: req.body.approved ? "Membership approved!" : "Membership cancelled!" });
        }
        return res.status(400).json({ message: "Member not found!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

exports.getAllMemberships = async (req, res) => {
    console.log("Received request to get all memberships");
    try {
        let members = await Membership.find().lean();
        return res.status(200).json(members);
    } catch (error) {
        console.error("Error occurred while fetching members:", error);
        res.status(500).json({ message: error.message });
    }
}

exports.deleteMembership = async (req, res) => {
    try {
        let id = req.params.id;
        let members = await Membership.deleteOne({ _id: id });
        if (members)
            return res.status(200).json({ message: "Member removed Successfully!" });
        console.log("Member deleted!");
        return res.status(500).json({ message: "Member not found!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getBlockedDates = async (req, res) => {
    try {
        let dates = await Membership.find({ function_date: { $nin: [null] } }, { function_date: 1 }).lean();
        if (dates && dates.length) {
            return res.status(200).json({ blocked_dates: _.map(dates, 'function_date') });
        }
        return res.status(200).json({ blocked_dates: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const generateMembershipIdCard = async (member) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 200]);

    page.drawText('Membership ID Card', {
        x: 50,
        y: 150,
        size: 20,
        color: rgb(0, 0.53, 0.71),
    });

    page.drawText(`Name: ${member.name}`, {
        x: 50,
        y: 120,
        size: 15,
    });

    page.drawText(`Membership ID: ${member.membership_id}`, {
        x: 50,
        y: 100,
        size: 15,
    });

    page.drawText(`Join Date: ${new Date(member.approval_date).toLocaleDateString()}`, {
        x: 50,
        y: 80,
        size: 15,
    });

    page.drawText(`Expiry Date: ${new Date(member.expiry_date).toLocaleDateString()}`, {
        x: 50,
        y: 60,
        size: 15,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};


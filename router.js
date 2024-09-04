var express = require('express');
var router = express.Router();

const db = require("./models");
const Project = db.projects;
const Op = db.Sequelize.Op;

// Dashboard
router.get('/', async function (req, res) {
    let company_id_fk;
    try{
        company_id_fk  = req.session.company.id;
    }
    
    catch(error){
        console.log("SESSION INVALID")
        res.redirect('/login'); // Redirect to login page or any other page
        // res.send("Session Expired or doesn't exist, redirect to expired page")
    }
    
    // Custom SQL query
    const query ='SELECT proj.company_id_fk, proj.id, proj.project_name, proj.start_date, proj.end_date,proj.health, proj.effort, prime_person.first_name AS prime_first_name, prime_person.last_name AS prime_last_name, sponsor_person.first_name AS sponsor_first_name, sponsor_person.last_name AS sponsor_last_name, proj.project_cost, phases.phase_name FROM projects proj LEFT JOIN persons prime_person ON prime_person.id = proj.prime_id_fk LEFT JOIN persons sponsor_person ON sponsor_person.id = proj.sponsor_id_fk LEFT JOIN phases ON phases.id = proj.phase_id_fk WHERE proj.company_id_fk = ?';

    let pitchCount = 0, pitchTotalCost = 0;
    let priorityCount = 0, priorityTotalCost = 0;
    let discoveryCount = 0, discoveryTotalCost = 0;
    let deliveryCount = 0, deliveryTotalCost = 0;
    let operationsCount = 0, operationsTotalCost = 0;
    let totalEstimatedCost = 0;
    

    let totalEffortPH = 0;

    await db.sequelize.query(query, {
        replacements: [company_id_fk],
        type: db.sequelize.QueryTypes.SELECT
    }).then(data => {
        
        data.forEach(function(project) {
            // let projectCost = parseFloat(project.project_cost);
            if (!project.effort===undefined || project.effort!="NaN"){
                totalEffortPH = parseFloat(project.project_cost);
                totalEffortPH+=totalEffortPH;
            }
            
            totalEstimatedCost+=projectCost;
            
            switch (project.phase_name.toLowerCase()) {
                case "pitch":
                    pitchTotalCost += projectCost;
                    pitchCount++;
                    break;
                case "priority":
                    priorityTotalCost += projectCost;
                    priorityCount++;
                    break;
                case "discovery":
                    discoveryTotalCost += projectCost;
                    discoveryCount++;
                    break;
                case "delivery":
                    deliveryTotalCost += projectCost;
                    deliveryCount++;
                    break;
                case "operations":
                    operationsTotalCost += projectCost;
                    operationsCount++;
                    break;
            }
        });

        var formatter = new Intl.NumberFormat('en-US');
        var pitchTotalSum = formatValue(formatter.format(pitchTotalCost));
        var priorityTotalSum = formatValue(formatter.format(priorityTotalCost));
        var discoveryTotalSum = formatValue(formatter.format(discoveryTotalCost));
        var deliveryTotalSum = formatValue(formatter.format(deliveryTotalCost));
        var operationsTotalSum = formatValue(formatter.format(operationsTotalCost));
        var totalCostSum = formatValue(formatter.format(totalEstimatedCost));
        // var totalAvailSum = totalCostSum-operationsTotalSum;
        // Perform subtraction directly on numbers
        var totalAvailSum = totalEstimatedCost - operationsTotalCost;
        //format what is left
        var totalAvailSum = formatValue(formatter.format(totalAvailSum));



        // console.log("pitchCount:",pitchCount)
        // console.log("priorityCount:",priorityCount)
        // console.log("discoveryCount:",discoveryCount)
        // console.log("deliveryCount:",deliveryCount)
        // console.log("operationsCount:",operationsCount)

        // console.log("pitchTotalSum:",pitchTotalSum)
        // console.log("priorityTotalSum:",priorityTotalSum)
        // console.log("discoveryTotalSum:",discoveryTotalSum)
        // console.log("deliveryTotalSum:",deliveryTotalSum)
        // console.log("operationsTotalSum:",operationsTotalSum)

        // console.log("Total Effort:",totalEffortPH);

        //calculate PH (completed is operations)


        
        // Render the page when all data retrieval operations are complete
        res.render('Dashboard/dashboard1', {
            projects: data,
            pitchCount: pitchCount,
            pitchTotalCost: pitchTotalSum,
            priorityCount: priorityCount,
            priorityTotalCost: priorityTotalSum,
            discoveryCount: discoveryCount,
            discoveryTotalCost: discoveryTotalSum,
            deliveryCount: deliveryCount,
            deliveryTotalCost: deliveryTotalSum,
            operationsCount: operationsCount,
            operationsTotalCost: operationsTotalSum,
            totalCostSum:totalCostSum,
            totalCostUsed:operationsTotalSum,
            totalAvailableCost: totalAvailSum
        });
    }).catch(err => {
        // res.status(500).send({
        //     message: err.message || "Some error occurred while retrieving data."
        // });
    });
});
function formatValue(value) {
   
    
    value = value.replace(/,/g, '');
    value = parseFloat(value); // Convert to a number
    if (value > 1000000) {
        return (value / 1000000).toFixed(0) + 'M';
    } else if (value > 1000) {
        return (value / 1000).toFixed(0) + 'K';
    } else {
        return value.toString();
    }
}

// Email
router.get('/email-compose', function (req, res) {
    res.render('Email/email-compose');
})
router.get('/email-inbox', function (req, res) {
    res.render('Email/email-inbox');
})
router.get('/email-read', function (req, res) {
    res.render('Email/email-read');
})
router.get('/email-templates-alert', function (req, res) {
    res.render('Email/email-templates-alert');
})
router.get('/email-templates-basic', function (req, res) {
    res.render('Email/email-templates-basic');
})
router.get('/email-templates-billing', function (req, res) {
    res.render('Email/email-templates-billing');
})

// UI Elements
router.get('/ui-alertify', function (req, res) {
    res.render('UiElements/ui-alertify');
})
router.get('/ui-alerts', function (req, res) {
    res.render('UiElements/ui-alerts');
})
router.get('/ui-animation', function (req, res) {
    res.render('UiElements/ui-animation');
})
router.get('/ui-badge', function (req, res) {
    res.render('UiElements/ui-badge');
})
router.get('/ui-buttons', function (req, res) {
    res.render('UiElements/ui-buttons');
})
router.get('/ui-cards', function (req, res) {
    res.render('UiElements/ui-cards');
})
router.get('/ui-carousel', function (req, res) {
    res.render('UiElements/ui-carousel');
})
router.get('/ui-colors', function (req, res) {
    res.render('UiElements/ui-colors');
})
router.get('/ui-dropdowns', function (req, res) {
    res.render('UiElements/ui-dropdowns');
})
router.get('/ui-grid', function (req, res) {
    res.render('UiElements/ui-grid');
})
router.get('/ui-highlight', function (req, res) {
    res.render('UiElements/ui-highlight');
})
router.get('/ui-images', function (req, res) {
    res.render('UiElements/ui-images');
})
router.get('/ui-lightbox', function (req, res) {
    res.render('UiElements/ui-lightbox');
})
router.get('/ui-modals', function (req, res) {
    res.render('UiElements/ui-modals');
})
router.get('/ui-navs', function (req, res) {
    res.render('UiElements/ui-navs');
})
router.get('/ui-nestable', function (req, res) {
    res.render('UiElements/ui-nestable');
})
router.get('/ui-pagination', function (req, res) {
    res.render('UiElements/ui-pagination');
})
router.get('/ui-popover-tooltips', function (req, res) {
    res.render('UiElements/ui-popover-tooltips');
})
router.get('/ui-progressbars', function (req, res) {
    res.render('UiElements/ui-progressbars');
})
router.get('/ui-rangeslider', function (req, res) {
    res.render('UiElements/ui-rangeslider');
})
router.get('/ui-rating', function (req, res) {
    res.render('UiElements/ui-rating');
})
router.get('/ui-sessiontimeout', function (req, res) {
    res.render('UiElements/ui-sessiontimeout');
})
router.get('/ui-sweet-alert', function (req, res) {
    res.render('UiElements/ui-sweet-alert');
})
router.get('/ui-sessiontimeout', function (req, res) {
    res.render('UiElements/ui-sessiontimeout');
})
router.get('/ui-tabs-accordions', function (req, res) {
    res.render('UiElements/ui-tabs-accordions');
})
router.get('/ui-typography', function (req, res) {
    res.render('UiElements/ui-typography');
})
router.get('/ui-video', function (req, res) {
    res.render('UiElements/ui-video');
})

// Form Elements

router.get('/form-elements', function (req, res) {
    res.render('Forms/form-elements');
})
router.get('/form-advanced', function (req, res) {
    res.render('Forms/form-advanced');
})
router.get('/form-editors', function (req, res) {
    res.render('Forms/form-editors');
})
router.get('/form-validation', function (req, res) {
    res.render('Forms/form-validation');
})
router.get('/form-mask', function (req, res) {
    res.render('Forms/form-mask');
})
router.get('/form-summernote', function (req, res) {
    res.render('Forms/form-summernote');
})
router.get('/form-uploads', function (req, res) {
    res.render('Forms/form-uploads');
})
router.get('/form-validation', function (req, res) {
    res.render('Forms/form-validation');
})
router.get('/form-wizard', function (req, res) {
    res.render('Forms/form-wizard');
})
router.get('/form-xeditable', function (req, res) {
    res.render('Forms/form-xeditable');
})

// Charts
router.get('/charts-c3', function (req, res) {
    res.render('Charts/charts-c3');
})
router.get('/charts-chartist', function (req, res) {
    res.render('Charts/charts-chartist');
})
router.get('/charts-chartjs', function (req, res) {
    res.render('Charts/charts-chartjs');
})
router.get('/charts-flot', function (req, res) {
    res.render('Charts/charts-flot');
})
router.get('/charts-morris', function (req, res) {
    res.render('Charts/charts-morris');
})
router.get('/charts-other', function (req, res) {
    res.render('Charts/charts-other');
})
router.get('/charts-peity', function (req, res) {
    res.render('Charts/charts-peity');
})
router.get('/charts-sparkline', function (req, res) {
    res.render('Charts/charts-sparkline');
})

//ecommerce
router.get('/ecommerce-customers', function (req, res) {
    res.render('Ecommerce/ecommerce-customers');
})
router.get('/ecommerce-order-history', function (req, res) {
    res.render('Ecommerce/ecommerce-order-history');
})
router.get('/ecommerce-product-edit', function (req, res) {
    res.render('Ecommerce/ecommerce-product-edit');
})
router.get('/ecommerce-product-grid', function (req, res) {
    res.render('Ecommerce/ecommerce-product-grid');
})
router.get('/ecommerce-product-list', function (req, res) {
    res.render('Ecommerce/ecommerce-product-list');
})

//tables
router.get('/tables-basic',function (req, res){
    res.render('Tables/tables-basic');
})
router.get('/tables-datatable',function (req, res){
    res.render('Tables/tables-datatable');
})
router.get('/tables-editable',function (req, res){
    res.render('Tables/tables-editable');
})
router.get('/tables-responsive',function (req, res){
    res.render('Tables/tables-responsive');
})

//Icons 
router.get('/icons-dripicons',function (req, res){
    res.render('Icons/icons-dripicons');
})
router.get('/icons-fontawesome',function (req, res){
    res.render('Icons/icons-fontawesome');
})
router.get('/icons-ion',function (req, res){
    res.render('Icons/icons-ion');
})
router.get('/icons-material',function (req, res){
    res.render('Icons/icons-material');
})
router.get('/icons-mobirise',function (req, res){
    res.render('Icons/icons-mobirise');
})
router.get('/icons-themify',function (req, res){
    res.render('Icons/icons-themify');
})
router.get('/icons-typicons',function (req, res){
    res.render('Icons/icons-typicons');
})
router.get('/icons-weather',function (req, res){
    res.render('Icons/icons-weather');
})

//Google Maps
router.get('/maps-google',function (req, res){
    res.render('Maps/maps-google');
})
router.get('/maps-vector',function (req, res){
    res.render('Maps/maps-vector');
})
//Widgets
router.get('/widgets',function (req, res){
    res.render('Widgets/widgets');
})
//pages
router.get('/pages-404',function (req, res){
    res.render('Pages/pages-404');
})
router.get('/pages-500',function (req, res){
    res.render('Pages/pages-500');
})
router.get('/pages-blank',function (req, res){
    res.render('Pages/pages-blank');
})
router.get('/pages-coming-soon',function (req, res){
    res.render('Pages/pages-coming-soon');
})
router.get('/pages-contact',function (req, res){
    res.render('Pages/pages-contact');
})
router.get('/pages-directory',function (req, res){
    res.render('Pages/pages-directory');
})
router.get('/pages-faq',function (req, res){
    res.render('Pages/pages-faq');
})
router.get('/pages-gallery',function (req, res){
    res.render('Pages/pages-gallery');
})
router.get('/pages-invoice',function (req, res){
    res.render('Pages/pages-invoice');
})
router.get('/pages-lock-screen-2',function (req, res){
    res.render('Pages/pages-lock-screen-2');
})
router.get('/pages-lock-screen',function (req, res){
    res.render('Pages/pages-lock-screen');
})
router.get('/pages-login-2',function (req, res){
    res.render('Pages/pages-login-2');
})
router.get('/pages-maintenance',function (req, res){
    res.render('Pages/pages-maintenance');
})
router.get('/pages-pricing',function (req, res){
    res.render('Pages/pages-pricing');
})
router.get('/pages-recoverpw-2',function (req, res){
    res.render('Pages/pages-recoverpw-2');
})
router.get('/pages-recoverpw',function (req, res){
    res.render('Pages/pages-recoverpw');
})
router.get('/pages-register-2',function (req, res){
    res.render('Pages/pages-register-2');
})
router.get('/pages-register',function (req, res){
    res.render('Pages/pages-register');
})
router.get('/pages-timeline',function (req, res){
    res.render('Pages/pages-timeline');
})

//partials
router.get('/Breadcrumb',function (req, res){
    res.render('Partials/Breadcrumb');
})
router.get('/Footer',function (req, res){
    res.render('Partials/Footer');
})
router.get('/FooterRoot',function (req, res){
    res.render('Partials/FooterRoot');
})
router.get('/FooterScript',function (req, res){
    res.render('Partials/FooterScript');
})
router.get('/Header',function (req, res){
    res.render('Partials/Header');
})
router.get('/HeaderRoot',function (req, res){
    res.render('Partials/HeaderRoot');
})
router.get('/HeaderStyle',function (req, res){
    res.render('Partials/HeaderStyle');
})
router.get('/Sidebar',function (req, res){
    res.render('Partials/Sidebar');
})
router.get('/TinyCharts',function (req, res){
    res.render('Partials/TinyCharts');
})



module.exports = router;
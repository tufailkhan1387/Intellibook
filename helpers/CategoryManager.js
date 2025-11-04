const XLSX = require('xlsx');
const path = require('path');

class CategoryManager {
    constructor() {
        this.categories = null;
        this.loadCategories();
    }

    loadCategories() {
        try {
            const filePath = path.join(__dirname, '../categories.xlsx');
            const workbook = XLSX.readFile(filePath);
            const sheetName = 'Allow&Disa Exp by Truelayer cat';
            
            if (!workbook.SheetNames.includes(sheetName)) {
                console.error('Sheet "Allow&Disa Exp by Truelayer cat" not found');
                return;
            }
            
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Skip header row and process data
            this.categories = jsonData.slice(1).map(row => ({
                trueLayerCategory: row[0] || '',
                subcategory: row[1] || '',
                allowableStatus: row[2] || '',
                prompt: row[3] || '',
                backgroundAction: row[4] || ''
            })).filter(row => row.trueLayerCategory); // Filter out empty rows
            
            console.log(`Loaded ${this.categories.length} categories from Excel`);
            
        } catch (error) {
            console.error('Error loading categories from Excel:', error);
            this.categories = [];
        }
    }

    getCategoriesByTrueLayerCategory(category) {
        if (!this.categories) return [];
        return this.categories.filter(cat => 
            cat.trueLayerCategory.toLowerCase().includes(category.toLowerCase())
        );
    }

    getSubcategoriesByTrueLayerCategory(category) {
        const matchingCategories = this.getCategoriesByTrueLayerCategory(category);
        return matchingCategories.map(cat => cat.subcategory).filter(sub => sub);
    }

    getAllowableStatus(category, subcategory) {
        if (!this.categories) return 'Review';
        const match = this.categories.find(cat => 
            cat.trueLayerCategory.toLowerCase().includes(category.toLowerCase()) &&
            cat.subcategory.toLowerCase().includes(subcategory.toLowerCase())
        );
        return match ? match.allowableStatus : 'Review';
    }

    getPromptForCategory(category, subcategory) {
        if (!this.categories) return '';
        const match = this.categories.find(cat => 
            cat.trueLayerCategory.toLowerCase().includes(category.toLowerCase()) &&
            cat.subcategory.toLowerCase().includes(subcategory.toLowerCase())
        );
        return match ? match.prompt : '';
    }

    getBackgroundAction(category, subcategory) {
        if (!this.categories) return '';
        const match = this.categories.find(cat => 
            cat.trueLayerCategory.toLowerCase().includes(category.toLowerCase()) &&
            cat.subcategory.toLowerCase().includes(subcategory.toLowerCase())
        );
        return match ? match.backgroundAction : '';
    }

    getAllTrueLayerCategories() {
        if (!this.categories) return [];
        return [...new Set(this.categories.map(cat => cat.trueLayerCategory))];
    }

    // Enhanced categorization using Excel data
    enhanceCategorization(transactionData) {
        const { transaction_category, description } = transactionData;
        
        // Find matching categories from Excel
        const matchingCategories = this.getCategoriesByTrueLayerCategory(transaction_category);
        
        if (matchingCategories.length > 0) {
            // Use the first matching category as base
            const baseCategory = matchingCategories[0];
            return {
                excelCategory: baseCategory.trueLayerCategory,
                excelSubcategory: baseCategory.subcategory,
                allowableStatus: baseCategory.allowableStatus,
                prompt: baseCategory.prompt,
                backgroundAction: baseCategory.backgroundAction,
                availableSubcategories: this.getSubcategoriesByTrueLayerCategory(transaction_category)
            };
        }
        
        return {
            excelCategory: transaction_category,
            excelSubcategory: '',
            allowableStatus: 'Review',
            prompt: '',
            backgroundAction: '',
            availableSubcategories: []
        };
    }
}

module.exports = CategoryManager;

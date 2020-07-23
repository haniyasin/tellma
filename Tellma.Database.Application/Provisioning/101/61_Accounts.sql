﻿UPDATE dbo.Accounts SET CurrencyId = N'SDG' WHERE CurrencyId = N'XXX'
DELETE FROM @InactiveAccountTypesIndexedIds;
INSERT INTO @InactiveAccountTypesIndexedIds([Index], [Id]) SELECT ROW_NUMBER() OVER(ORDER BY [Id]), [Id]  FROM dbo.AccountTypes WHERE [Concept] NOT IN (
(N'StatementOfFinancialPositionAbstract'),
(N'Assets'),
(N'NoncurrentAssets'),
(N'PropertyPlantAndEquipment'),
--(N'LandAndBuildings'),
--(N'Land'),
--(N'Buildings'),
--(N'Machinery'),
--(N'Vehicles'),
--(N'Ships'),
--(N'Aircraft'),
--(N'MotorVehicles'),
(N'FixturesAndFittings'),
(N'OfficeEquipment'),
--(N'BearerPlants'),
--(N'TangibleExplorationAndEvaluationAssets'),
--(N'MiningAssets'),
--(N'OilAndGasAssets'),
--(N'ConstructionInProgress'),
(N'OwneroccupiedPropertyMeasuredUsingInvestmentPropertyFairValueModel'),
(N'OtherPropertyPlantAndEquipment'),
--(N'InvestmentProperty'),
--(N'InvestmentPropertyCompleted'),
--(N'InvestmentPropertyUnderConstructionOrDevelopment'),
--(N'Goodwill'),
(N'IntangibleAssetsOtherThanGoodwill'),
--(N'InvestmentAccountedForUsingEquityMethod'),
--(N'InvestmentsInAssociatesAccountedForUsingEquityMethod'),
--(N'InvestmentsInJointVenturesAccountedForUsingEquityMethod'),
--(N'InvestmentsInSubsidiariesJointVenturesAndAssociates'),
--(N'InvestmentsInSubsidiaries'),
--(N'InvestmentsInJointVentures'),
--(N'InvestmentsInAssociates'),
--(N'NoncurrentBiologicalAssets'),
(N'NoncurrentReceivables'),
(N'NoncurrentTradeReceivables'),
(N'NoncurrentReceivablesDueFromRelatedParties'),
(N'NoncurrentPrepaymentsAndNoncurrentAccruedIncome'),
(N'NoncurrentPrepayments'),
(N'NoncurrentAccruedIncome'),
(N'NoncurrentReceivablesFromTaxesOtherThanIncomeTax'),
--(N'NoncurrentValueAddedTaxReceivables'),
--(N'NoncurrentReceivablesFromSaleOfProperties'),
--(N'NoncurrentReceivablesFromRentalOfProperties'),
(N'OtherNoncurrentReceivables'),
--(N'NoncurrentInventories'),
(N'DeferredTaxAssets'),
(N'CurrentTaxAssetsNoncurrent'),
(N'OtherNoncurrentFinancialAssets'),
(N'NonCurrentLoansExtension'),
--(N'OtherNoncurrentNonfinancialAssets'),
--(N'NoncurrentNoncashAssetsPledgedAsCollateralForWhichTransfereeHasRightByContractOrCustomToSellOrRepledgeCollateral'),
(N'CurrentAssets'),
--(N'Inventories'),
--(N'CurrentInventoriesHeldForSale'),
--(N'Merchandise'),
--(N'CurrentFoodAndBeverage'),
--(N'CurrentAgriculturalProduce'),
--(N'FinishedGoods'),
--(N'PropertyIntendedForSaleInOrdinaryCourseOfBusiness'),
(N'WorkInProgress'),
--(N'CurrentMaterialsAndSuppliesToBeConsumedInProductionProcessOrRenderingServices'),
--(N'CurrentRawMaterialsAndCurrentProductionSupplies'),
--(N'RawMaterials'),
--(N'ProductionSupplies'),
--(N'CurrentPackagingAndStorageMaterials'),
--(N'SpareParts'),
--(N'CurrentFuel'),
--(N'CurrentInventoriesInTransit'),
--(N'OtherInventories'),
(N'TradeAndOtherCurrentReceivables'),
(N'CurrentTradeReceivables'),
(N'TradeAndOtherCurrentReceivablesDueFromRelatedParties'),
(N'CurrentPrepaymentsAndCurrentAccruedIncome'),
(N'CurrentPrepayments'),
(N'CurrentAdvancesToSuppliers'),
(N'CurrentPrepaidExpenses'),
(N'CurrentAccruedIncome'),
(N'CurrentBilledButNotReceivedExtension'),
(N'CurrentReceivablesFromTaxesOtherThanIncomeTax'),
(N'CurrentValueAddedTaxReceivables'),
--(N'WithholdingTaxReceivablesExtension'),
(N'CurrentReceivablesFromRentalOfProperties'),
(N'OtherCurrentReceivables'),
--(N'AllowanceAccountForCreditLossesOfTradeAndOtherCurrentReceivablesExtension'),
(N'CurrentTaxAssetsCurrent'),
--(N'CurrentBiologicalAssets'),
(N'OtherCurrentFinancialAssets'),
(N'CurrentLoansExtension'),
--(N'OtherCurrentNonfinancialAssets'),
(N'CashAndCashEquivalents'),
(N'Cash'),
(N'CashOnHand'),
(N'BalancesWithBanks'),
(N'CashEquivalents'),
--(N'ShorttermDepositsClassifiedAsCashEquivalents'),
--(N'ShorttermInvestmentsClassifiedAsCashEquivalents'),
--(N'BankingArrangementsClassifiedAsCashEquivalents'),
(N'OtherCashAndCashEquivalents'),
--(N'CurrentNoncashAssetsPledgedAsCollateralForWhichTransfereeHasRightByContractOrCustomToSellOrRepledgeCollateral'),
(N'NoncurrentAssetsOrDisposalGroupsClassifiedAsHeldForSaleOrAsHeldForDistributionToOwners'),
--(N'AllowanceAccountForCreditLossesOfFinancialAssets'),
--(N'AllowanceAccountForCreditLossesOfTradeAndOtherReceivablesExtension'),
--(N'AllowanceAccountForCreditLossesOfOtherFinancialAssetsExtension'),
(N'EquityAndLiabilities'),
(N'Equity'),
(N'IssuedCapital'),
(N'RetainedEarnings'),
--(N'SharePremium'),
--(N'TreasuryShares'),
--(N'OtherEquityInterest'),
(N'OtherReserves'),
(N'RevaluationSurplus'),
(N'ReserveOfExchangeDifferencesOnTranslation'),
--(N'ReserveOfCashFlowHedges'),
--(N'ReserveOfGainsAndLossesOnHedgingInstrumentsThatHedgeInvestmentsInEquityInstruments'),
--(N'ReserveOfChangeInValueOfTimeValueOfOptions'),
--(N'ReserveOfChangeInValueOfForwardElementsOfForwardContracts'),
--(N'ReserveOfChangeInValueOfForeignCurrencyBasisSpreads'),
--(N'ReserveOfGainsAndLossesOnFinancialAssetsMeasuredAtFairValueThroughOtherComprehensiveIncome'),
--(N'ReserveOfInsuranceFinanceIncomeExpensesFromInsuranceContractsIssuedExcludedFromProfitOrLossThatWillBeReclassifiedToProfitOrLoss'),
--(N'ReserveOfInsuranceFinanceIncomeExpensesFromInsuranceContractsIssuedExcludedFromProfitOrLossThatWillNotBeReclassifiedToProfitOrLoss'),
--(N'ReserveOfFinanceIncomeExpensesFromReinsuranceContractsHeldExcludedFromProfitOrLoss'),
--(N'ReserveOfGainsAndLossesOnRemeasuringAvailableforsaleFinancialAssets'),
--(N'ReserveOfSharebasedPayments'),
--(N'ReserveOfRemeasurementsOfDefinedBenefitPlans'),
--(N'AmountRecognisedInOtherComprehensiveIncomeAndAccumulatedInEquityRelatingToNoncurrentAssetsOrDisposalGroupsHeldForSale'),
--(N'ReserveOfGainsAndLossesFromInvestmentsInEquityInstruments'),
--(N'ReserveOfChangeInFairValueOfFinancialLiabilityAttributableToChangeInCreditRiskOfLiability'),
--(N'ReserveForCatastrophe'),
--(N'ReserveForEqualisation'),
--(N'ReserveOfDiscretionaryParticipationFeatures'),
--(N'ReserveOfEquityComponentOfConvertibleInstruments'),
--(N'CapitalRedemptionReserve'),
--(N'MergerReserve'),
(N'StatutoryReserve'),
(N'Liabilities'),
(N'NoncurrentLiabilities'),
--(N'NoncurrentProvisions'),
--(N'NoncurrentProvisionsForEmployeeBenefits'),
--(N'OtherLongtermProvisions'),
--(N'LongtermWarrantyProvision'),
--(N'LongtermRestructuringProvision'),
--(N'LongtermLegalProceedingsProvision'),
--(N'NoncurrentRefundsProvision'),
--(N'LongtermOnerousContractsProvision'),
--(N'LongtermProvisionForDecommissioningRestorationAndRehabilitationCosts'),
--(N'LongtermMiscellaneousOtherProvisions'),
(N'NoncurrentPayables'),
--(N'DeferredTaxLiabilities'),
--(N'CurrentTaxLiabilitiesNoncurrent'),
--(N'OtherNoncurrentFinancialLiabilities'),
--(N'NoncurrentFinancialLiabilitiesAtFairValueThroughProfitOrLoss'),
--(N'NoncurrentFinancialLiabilitiesAtFairValueThroughProfitOrLossClassifiedAsHeldForTrading'),
--(N'NoncurrentFinancialLiabilitiesAtFairValueThroughProfitOrLossDesignatedUponInitialRecognition'),
--(N'NoncurrentFinancialLiabilitiesAtAmortisedCost'),
--(N'OtherNoncurrentNonfinancialLiabilities'),
(N'CurrentLiabilities'),
--(N'CurrentProvisions'),
--(N'CurrentProvisionsForEmployeeBenefits'),
--(N'OtherShorttermProvisions'),
--(N'ShorttermWarrantyProvision'),
--(N'ShorttermRestructuringProvision'),
--(N'ShorttermLegalProceedingsProvision'),
--(N'CurrentRefundsProvision'),
--(N'ShorttermOnerousContractsProvision'),
--(N'ShorttermProvisionForDecommissioningRestorationAndRehabilitationCosts'),
--(N'ShorttermMiscellaneousOtherProvisions'),
(N'TradeAndOtherCurrentPayables'),
(N'TradeAndOtherCurrentPayablesToTradeSuppliers'),
(N'TradeAndOtherCurrentPayablesToRelatedParties'),
(N'AccrualsAndDeferredIncomeClassifiedAsCurrent'),
(N'DeferredIncomeClassifiedAsCurrent'),
(N'RentDeferredIncomeClassifiedAsCurrent'),
(N'AccrualsClassifiedAsCurrent'),
--(N'ShorttermEmployeeBenefitsAccruals'),
(N'CurrentBilledButNotIssuedExtension'),
(N'CurrentPayablesOnSocialSecurityAndTaxesOtherThanIncomeTax'),
(N'CurrentValueAddedTaxPayables'),
--(N'CurrentExciseTaxPayables'),
(N'CurrentSocialSecurityPayablesExtension'),
(N'CurrentZakatPayablesExtension'),
(N'CurrentEmployeeIncomeTaxPayablesExtension'),
(N'CurrentEmployeeStampTaxPayablesExtension'),
--(N'ProvidentFundPayableExtension'),
--(N'WithholdingTaxPayableExtension'),
--(N'CostSharingPayableExtension'),
--(N'DividendTaxPayableExtension'),
--(N'CurrentRetentionPayables'),
(N'OtherCurrentPayables'),
(N'CurrentTaxLiabilitiesCurrent'),
(N'OtherCurrentFinancialLiabilities'),
(N'CurrentFinancialLiabilitiesAtFairValueThroughProfitOrLossAbstract'),
(N'CurrentFinancialLiabilitiesAtFairValueThroughProfitOrLossClassifiedAsHeldForTrading'),
(N'CurrentFinancialLiabilitiesAtFairValueThroughProfitOrLossDesignatedUponInitialRecognition'),
(N'CurrentFinancialLiabilitiesAtAmortisedCost'),
--(N'OtherCurrentNonfinancialLiabilities'),
--(N'LiabilitiesIncludedInDisposalGroupsClassifiedAsHeldForSale'),
(N'IncomeStatementAbstract'),
(N'ProfitLoss'),
(N'ProfitLossFromContinuingOperations'),
(N'ProfitLossBeforeTax'),
(N'ProfitLossFromOperatingActivities'),
(N'Revenue'),
--(N'RevenueFromSaleOfGoods'),
--(N'RevenueFromSaleOfFoodAndBeverage'),
--(N'RevenueFromSaleOfAgriculturalProduce'),
(N'RevenueFromRenderingOfServices'),
--(N'RevenueFromConstructionContracts'),
--(N'RevenueFromRoyalties'),
--(N'LicenceFeeIncome'),
--(N'FranchiseFeeIncome'),
--(N'RevenueFromInterest'),
(N'RevenueFromDividends'),
(N'OtherRevenue'),
(N'OtherIncome'),
--(N'ChangesInInventoriesOfFinishedGoodsAndWorkInProgress'),
(N'OtherWorkPerformedByEntityAndCapitalised'),
(N'ExpenseByNature'),
(N'RawMaterialsAndConsumablesUsed'),
--(N'CostOfMerchandiseSold'),
(N'ServicesExpense'),
(N'InsuranceExpense'),
(N'ProfessionalFeesExpense'),
(N'TransportationExpense'),
(N'BankAndSimilarCharges'),
(N'TravelExpense'),
(N'CommunicationExpense'),
(N'UtilitiesExpense'),
(N'AdvertisingExpense'),
(N'EmployeeBenefitsExpense'),
(N'ShorttermEmployeeBenefitsExpense'),
(N'WagesAndSalaries'),
(N'SocialSecurityContributions'),
(N'OtherShorttermEmployeeBenefits'),
--(N'PostemploymentBenefitExpenseDefinedContributionPlans'),
--(N'PostemploymentBenefitExpenseDefinedBenefitPlans'),
(N'TerminationBenefitsExpense'),
--(N'OtherLongtermBenefits'),
(N'OtherEmployeeExpense'),
(N'DepreciationAmortisationAndImpairmentLossReversalOfImpairmentLossRecognisedInProfitOrLoss'),
(N'DepreciationAndAmortisationExpense'),
(N'DepreciationExpense'),
(N'AmortisationExpense'),
(N'ImpairmentLossReversalOfImpairmentLossRecognisedInProfitOrLoss'),
--(N'WritedownsReversalsOfInventories'),
(N'WritedownsReversalsOfPropertyPlantAndEquipment'),
(N'ImpairmentLossReversalOfImpairmentLossRecognisedInProfitOrLossTradeReceivables'),
(N'ImpairmentLossReversalOfImpairmentLossRecognisedInProfitOrLossLoansAndAdvances'),
(N'TaxExpenseOtherThanIncomeTaxExpense'),
(N'OtherExpenseByNature'),
(N'OtherGainsLosses'),
(N'GainsLossesOnDisposalsOfPropertyPlantAndEquipment'),
(N'GainsOnDisposalsOfPropertyPlantAndEquipment'),
(N'LossesOnDisposalsOfPropertyPlantAndEquipment'),
--(N'GainsLossesOnDisposalsOfInvestmentProperties'),
--(N'GainsOnDisposalsOfInvestmentProperties'),
--(N'LossesOnDisposalsOfInvestmentProperties'),
--(N'GainsLossesOnDisposalsOfInvestments'),
--(N'GainsOnDisposalsOfInvestments'),
--(N'LossesOnDisposalsOfInvestments'),
(N'GainsLossesOnExchangeDifferencesOnTranslationRecognisedInProfitOrLoss'),
(N'NetForeignExchangeGain'),
(N'NetForeignExchangeLoss'),
(N'GainsLossesOnNetMonetaryPosition'),
(N'GainLossArisingFromDerecognitionOfFinancialAssetsMeasuredAtAmortisedCost'),
--(N'FinanceIncome'),
--(N'FinanceCosts'),
(N'ImpairmentLossImpairmentGainAndReversalOfImpairmentLossDeterminedInAccordanceWithIFRS9'),
--(N'ShareOfProfitLossOfAssociatesAndJointVenturesAccountedForUsingEquityMethod'),
--(N'OtherIncomeExpenseFromSubsidiariesJointlyControlledEntitiesAndAssociates'),
--(N'GainsLossesArisingFromDifferenceBetweenPreviousCarryingAmountAndFairValueOfFinancialAssetsReclassifiedAsMeasuredAtFairValue'),
--(N'CumulativeGainLossPreviouslyRecognisedInOtherComprehensiveIncomeArisingFromReclassificationOfFinancialAssetsOutOfFairValueThroughOtherComprehensiveIncomeIntoFairValueThroughProfitOrLossMeasurementCategory'),
--(N'HedgingGainsLossesForHedgeOfGroupOfItemsWithOffsettingRiskPositions'),
(N'IncomeTaxExpenseContinuingOperations'),
(N'ProfitLossFromDiscontinuedOperations'),
(N'OtherComprehensiveIncome'),
(N'ComponentsOfOtherComprehensiveIncomeThatWillNotBeReclassifiedToProfitOrLossBeforeTax'),
--(N'OtherComprehensiveIncomeBeforeTaxGainsLossesFromInvestmentsInEquityInstruments'),
(N'OtherComprehensiveIncomeBeforeTaxGainsLossesOnRevaluation'),
--(N'OtherComprehensiveIncomeBeforeTaxGainsLossesOnRemeasurementsOfDefinedBenefitPlans'),
--(N'OtherComprehensiveIncomeBeforeTaxChangeInFairValueOfFinancialLiabilityAttributableToChangeInCreditRiskOfLiability'),
--(N'OtherComprehensiveIncomeBeforeTaxGainsLossesOnHedgingInstrumentsThatHedgeInvestmentsInEquityInstruments'),
--(N'OtherComprehensiveIncomeBeforeTaxInsuranceFinanceIncomeExpensesFromInsuranceContractsIssuedExcludedFromProfitOrLossThatWillNotBeReclassifiedToProfitOrLoss'),
--(N'ShareOfOtherComprehensiveIncomeOfAssociatesAndJointVenturesAccountedForUsingEquityMethodThatWillNotBeReclassifiedToProfitOrLossBeforeTax'),
(N'ComponentsOfOtherComprehensiveIncomeThatWillBeReclassifiedToProfitOrLossBeforeTax'),
(N'OtherComprehensiveIncomeBeforeTaxExchangeDifferencesOnTranslation'),
(N'GainsLossesOnExchangeDifferencesOnTranslationBeforeTax'),
(N'ReclassificationAdjustmentsOnExchangeDifferencesOnTranslationBeforeTax'),
--(N'OtherComprehensiveIncomeBeforeTaxAvailableforsaleFinancialAssets'),
--(N'GainsLossesOnRemeasuringAvailableforsaleFinancialAssetsBeforeTax'),
--(N'ReclassificationAdjustmentsOnAvailableforsaleFinancialAssetsBeforeTax'),
(N'ControlAccountsExtension'),
(N'TradersControlAccountsExtension'),
(N'SuppliersControlAccountsExtension'),
(N'CashPaymentsToSuppliersControlExtension'),
(N'GoodsAndServicesReceivedFromSuppliersControlExtensions'),
(N'CustomersControlAccountsExtension'),
(N'CashReceiptsFromCustomersControlExtension'),
(N'GoodsAndServicesIssuedToCustomersControlExtension'),
(N'PayrollControlExtension'),
(N'OthersAccountsControlExtension'),
(N'CashPaymentsToOthersControlExtension'),
(N'CashReceiptsFromOthersControlExtension'),
--(N'GuaranteesExtension'),
--(N'CollectionGuaranteeExtension'),
--(N'DishonouredGuaranteeExtension'),
(N'MigrationAccountsExtension')
)
EXEC [api].[AccountTypes__Activate]
	@IndexedIds = @InactiveAccountTypesIndexedIds,
	@IsActive = 0,
	@ValidationErrorsJson = @ValidationErrorsJson OUTPUT;

IF @ValidationErrorsJson IS NOT NULL 
BEGIN
	Print 'Account Types: Deactivating: ' + @ValidationErrorsJson
	GOTO Err_Label;
END;
	
DELETE FROM @AccountClassificationsIndexedIds;
INSERT INTO @AccountClassificationsIndexedIds ([Index], [Id]) SELECT ROW_NUMBER() OVER(ORDER BY [Id]), [Id]  FROM dbo.AccountClassifications
WHERE AccountTypeParentId IN (SELECT [Id] FROM @InactiveAccountTypesIndexedIds);
EXEC [api].[AccountClassifications__Activate]
	@IndexedIds = @AccountClassificationsIndexedIds,
	@IsActive = 0,
	@ValidationErrorsJson = @ValidationErrorsJson OUTPUT;

IF @ValidationErrorsJson IS NOT NULL 
BEGIN
	Print 'Account Classifications: Deactivating: ' + @ValidationErrorsJson
	GOTO Err_Label;
END;

DELETE FROM @AccountsIndexedIds;
INSERT INTO @AccountsIndexedIds([Index], [Id]) SELECT ROW_NUMBER() OVER(ORDER BY [Id]), [Id]  FROM dbo.Accounts
WHERE AccountTypeId IN (SELECT [Id] FROM @InactiveAccountTypesIndexedIds);
EXEC [api].[Accounts__Activate]
	@IndexedIds = @AccountsIndexedIds,
	@IsActive = 0,
	@ValidationErrorsJson = @ValidationErrorsJson OUTPUT;

IF @ValidationErrorsJson IS NOT NULL 
BEGIN
	Print 'Accounts: Deactivating: ' + @ValidationErrorsJson
	GOTO Err_Label;
END;
IF (1=0)
SELECT
N'Partners Withdrawals',		N'Abu Ammar Car Loan',		N'M. Ali Car Loan',	N'El-Amin Car Loan',			
N'Office Rent',	N'Internet Prepayment',	 N'Car Rent Prepayment', N'House Rent Prepayment', N'Maintenance Prepayment',		

N'GM Fund',	N'Admin Fund - SDG',	 N'Bank Of Khartoum - SDG',
N'10% Retained Salaries', N'PrimeLedgers A/P',

	N'Dividends Payables',			
	N'Borrowings from M/A',	
	N'Rental Income - SAR',	
	N'Internet & Tel',	
	N'Electricity',
	N'Bonuses',	
	N'Termination Benefits',
	N'Exchange Loss (Gain)'

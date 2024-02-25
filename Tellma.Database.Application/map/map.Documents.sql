﻿CREATE FUNCTION [map].[Documents]()
RETURNS TABLE
AS
RETURN (
	SELECT
		D.[Id],
		D.[DefinitionId],
		D.[SerialNumber],
		D.[State],
		D.[StateAt],
		D.[Clearance],
		D.[PostingDate],
		D.[PostingDateIsCommon],
		D.[Memo],
		D.[MemoIsCommon],
		D.[CurrencyId],
		D.[CurrencyIsCommon],
		D.[CenterId],
		D.[CenterIsCommon],
		D.[AgentId],
		D.[AgentIsCommon],
		D.[NotedAgentId],
		D.[NotedAgentIsCommon],
		D.[ResourceId],
		D.[ResourceIsCommon],
		D.[NotedResourceId],
		D.[NotedResourceIsCommon],
		D.[Quantity],
		D.[QuantityIsCommon],
		D.[UnitId],
		D.[UnitIsCommon],
		D.[Time1],
		D.[Time1IsCommon],
		D.[Duration],
		D.[DurationIsCommon],
		D.[DurationUnitId],
		D.[DurationUnitIsCommon],
		D.[Time2],
		D.[Time2IsCommon],
		D.[NotedDate],
		D.[NotedDateIsCommon],

		D.[ExternalReference],
		D.[ExternalReferenceIsCommon],
		D.[ReferenceSourceId],
		D.[ReferenceSourceIsCommon],
		D.[InternalReference],
		D.[InternalReferenceIsCommon],
		D.[Lookup1Id],
		D.[Lookup2Id],
		
		D.[ZatcaState],
		D.[ZatcaResult],
		D.[ZatcaSerialNumber],
		D.[ZatcaHash],
		D.[ZatcaUuid],

		D.[CreatedAt],
		D.[CreatedById],
		D.[ModifiedAt],
		D.[ModifiedById],
		[bll].[fn_Prefix_CodeWidth_SN__Code](DD.[Prefix], DD.[CodeWidth], D.[SerialNumber]) AS [Code],
		A.[Comment], A.[AssigneeId], A.[CreatedAt] AS [AssignedAt], A.[CreatedById] AS [AssignedById], A.[OpenedAt]
	FROM [dbo].[Documents] D
	JOIN [dbo].[DocumentDefinitions] DD ON D.[DefinitionId] = DD.[Id]
	LEFT JOIN [dbo].[DocumentAssignments] A ON D.[Id] = A.[DocumentId]
);
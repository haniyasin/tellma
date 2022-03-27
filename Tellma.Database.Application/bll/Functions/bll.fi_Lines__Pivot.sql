﻿CREATE FUNCTION [bll].[fi_Lines__Pivot]
(
	@Lines dbo.[LineList] READONLY,
	@Entries dbo.[EntryList] READONLY
)
RETURNS TABLE AS RETURN
(
	SELECT
		L.[Index],
		L.[DocumentIndex],
		L.[Id],
		L.[DefinitionId],
		L.[PostingDate],
		L.[Memo],
		L.[Boolean1],
		L.[Decimal1],
		L.[Text1],

		E0.[Id] AS [Id0],
		E0.[Direction] AS [Direction0],
		E0.[AccountId] AS [AccountId0],
		E0.[AgentId] AS [AgentId0],
		E0.[NotedAgentId] AS [NotedAgentId0],
		E0.[ResourceId] AS [ResourceId0],
		E0.[CenterId] AS [CenterId0],
		E0.[CurrencyId] AS [CurrencyId0],
		E0.[EntryTypeId] AS [EntryTypeId0],
		E0.[MonetaryValue] AS [MonetaryValue0],
		E0.[Quantity] AS [Quantity0],
		E0.[UnitId] AS [UnitId0],
		E0.[Value] AS [Value0],
		E0.[Time1] AS [Time10],
		E0.[Duration] AS [Duration0],
		E0.[DurationUnitId] AS [DurationUnitId0],
		E0.[Time2] AS [Time20],
		E0.[ExternalReference] AS [ExternalReference0],
		E0.[ReferenceSourceId] AS [ReferenceSourceId0],
		E0.[InternalReference] AS [InternalReference0],
		E0.[NotedAgentName] AS [NotedAgentName0],
		E0.[NotedAmount] AS [NotedAmount0],
		E0.[NotedDate] AS [NotedDate0],
		E0.[NotedResourceId] AS [NotedResourceId0],

		E1.[Id] AS [Id1],
		E1.[Direction] AS [Direction1],
		E1.[AccountId] AS [AccountId1],
		E1.[AgentId] AS [AgentId1],
		E1.[NotedAgentId] AS [NotedAgentId1],
		E1.[ResourceId] AS [ResourceId1],
		E1.[CenterId] AS [CenterId1],
		E1.[CurrencyId] AS [CurrencyId1],
		E1.[EntryTypeId] AS [EntryTypeId1],
		E1.[MonetaryValue] AS [MonetaryValue1],
		E1.[Quantity] AS [Quantity1],
		E1.[UnitId] AS [UnitId1],
		E1.[Value] AS [Value1],
		E1.[Time1] AS [Time11],
		E1.[Duration] AS [Duration1],
		E1.[DurationUnitId] AS [DurationUnitId1],
		E1.[Time2] AS [Time21],
		E1.[ExternalReference] AS [ExternalReference1],
		E1.[ReferenceSourceId] AS [ReferenceSourceId1],
		E1.[InternalReference] AS [InternalReference1],
		E1.[NotedAgentName] AS [NotedAgentName1],
		E1.[NotedAmount] AS [NotedAmount1],
		E1.[NotedDate] AS [NotedDate1],
		E1.[NotedResourceId] AS [NotedResourceId1],

		E2.[Id] AS [Id2],
		E2.[Direction] AS [Direction2],
		E2.[AccountId] AS [AccountId2],
		E2.[AgentId] AS [AgentId2],
		E2.[NotedAgentId] AS [NotedAgentId2],
		E2.[ResourceId] AS [ResourceId2],
		E2.[CenterId] AS [CenterId2],
		E2.[CurrencyId] AS [CurrencyId2],
		E2.[EntryTypeId] AS [EntryTypeId2],
		E2.[MonetaryValue] AS [MonetaryValue2],
		E2.[Quantity] AS [Quantity2],
		E2.[UnitId] AS [UnitId2],
		E2.[Value] AS [Value2],
		E2.[Time1] AS [Time12],
		E2.[Duration] AS [Duration2],
		E2.[DurationUnitId] AS [DurationUnitId2],
		E2.[Time2] AS [Time22],
		E2.[ExternalReference] AS [ExternalReference2],
		E2.[ReferenceSourceId] AS [ReferenceSourceId2],
		E2.[InternalReference] AS [InternalReference2],
		E2.[NotedAgentName] AS [NotedAgentName2],
		E2.[NotedAmount] AS [NotedAmount2],
		E2.[NotedDate] AS [NotedDate2],
		E2.[NotedResourceId] AS [NotedResourceId2],

		E3.[Id] AS [Id3],
		E3.[Direction] AS [Direction3],
		E3.[AccountId] AS [AccountId3],
		E3.[AgentId] AS [AgentId3],
		E3.[NotedAgentId] AS [NotedAgentId3],
		E3.[ResourceId] AS [ResourceId3],
		E3.[CenterId] AS [CenterId3],
		E3.[CurrencyId] AS [CurrencyId3],
		E3.[EntryTypeId] AS [EntryTypeId3],
		E3.[MonetaryValue] AS [MonetaryValue3],
		E3.[Quantity] AS [Quantity3],
		E3.[UnitId] AS [UnitId3],
		E3.[Value] AS [Value3],
		E3.[Time1] AS [Time13],
		E3.[Duration] AS [Duration3],
		E3.[DurationUnitId] AS [DurationUnitId3],
		E3.[Time2] AS [Time23],
		E3.[ExternalReference] AS [ExternalReference3],
		E3.[ReferenceSourceId] AS [ReferenceSourceId3],
		E3.[InternalReference] AS [InternalReference3],
		E3.[NotedAgentName] AS [NotedAgentName3],
		E3.[NotedAmount] AS [NotedAmount3],
		E3.[NotedDate] AS [NotedDate3],
		E3.[NotedResourceId] AS [NotedResourceId3],

		E4.[Id] AS [Id4],
		E4.[Direction] AS [Direction4],
		E4.[AccountId] AS [AccountId4],
		E4.[AgentId] AS [AgentId4],
		E4.[NotedAgentId] AS [NotedAgentId4],
		E4.[ResourceId] AS [ResourceId4],
		E4.[CenterId] AS [CenterId4],
		E4.[CurrencyId] AS [CurrencyId4],
		E4.[EntryTypeId] AS [EntryTypeId4],
		E4.[MonetaryValue] AS [MonetaryValue4],
		E4.[Quantity] AS [Quantity4],
		E4.[UnitId] AS [UnitId4],
		E4.[Value] AS [Value4],
		E4.[Time1] AS [Time14],
		E4.[Duration] AS [Duration4],
		E4.[DurationUnitId] AS [DurationUnitId4],
		E4.[Time2] AS [Time24],
		E4.[ExternalReference] AS [ExternalReference4],
		E4.[ReferenceSourceId] AS [ReferenceSourceId4],
		E4.[InternalReference] AS [InternalReference4],
		E4.[NotedAgentName] AS [NotedAgentName4],
		E4.[NotedAmount] AS [NotedAmount4],
		E4.[NotedDate] AS [NotedDate4],
		E4.[NotedResourceId] AS [NotedResourceId4],

		E5.[Id] AS [Id5],
		E5.[Direction] AS [Direction5],
		E5.[AccountId] AS [AccountId5],
		E5.[AgentId] AS [AgentId5],
		E5.[NotedAgentId] AS [NotedAgentId5],
		E5.[ResourceId] AS [ResourceId5],
		E5.[CenterId] AS [CenterId5],
		E5.[CurrencyId] AS [CurrencyId5],
		E5.[EntryTypeId] AS [EntryTypeId5],
		E5.[MonetaryValue] AS [MonetaryValue5],
		E5.[Quantity] AS [Quantity5],
		E5.[UnitId] AS [UnitId5],
		E5.[Value] AS [Value5],
		E5.[Time1] AS [Time15],
		E5.[Duration] AS [Duration5],
		E5.[DurationUnitId] AS [DurationUnitId5],
		E5.[Time2] AS [Time25],
		E5.[ExternalReference] AS [ExternalReference5],
		E5.[ReferenceSourceId] AS [ReferenceSourceId5],
		E5.[InternalReference] AS [InternalReference5],
		E5.[NotedAgentName] AS [NotedAgentName5],
		E5.[NotedAmount] AS [NotedAmount5],
		E5.[NotedDate] AS [NotedDate5],
		E5.[NotedResourceId] AS [NotedResourceId5],

		E6.[Id] AS [Id6],
		E6.[Direction] AS [Direction6],
		E6.[AccountId] AS [AccountId6],
		E6.[AgentId] AS [AgentId6],
		E6.[NotedAgentId] AS [NotedAgentId6],
		E6.[ResourceId] AS [ResourceId6],
		E6.[CenterId] AS [CenterId6],
		E6.[CurrencyId] AS [CurrencyId6],
		E6.[EntryTypeId] AS [EntryTypeId6],
		E6.[MonetaryValue] AS [MonetaryValue6],
		E6.[Quantity] AS [Quantity6],
		E6.[UnitId] AS [UnitId6],
		E6.[Value] AS [Value6],
		E6.[Time1] AS [Time16],
		E6.[Duration] AS [Duration6],
		E6.[DurationUnitId] AS [DurationUnitId6],
		E6.[Time2] AS [Time26],
		E6.[ExternalReference] AS [ExternalReference6],
		E6.[ReferenceSourceId] AS [ReferenceSourceId6],
		E6.[InternalReference] AS [InternalReference6],
		E6.[NotedAgentName] AS [NotedAgentName6],
		E6.[NotedAmount] AS [NotedAmount6],
		E6.[NotedDate] AS [NotedDate6],
		E6.[NotedResourceId] AS [NotedResourceId6],

		E7.[Id] AS [Id7],
		E7.[Direction] AS [Direction7],
		E7.[AccountId] AS [AccountId7],
		E7.[AgentId] AS [AgentId7],
		E7.[NotedAgentId] AS [NotedAgentId7],
		E7.[ResourceId] AS [ResourceId7],
		E7.[CenterId] AS [CenterId7],
		E7.[CurrencyId] AS [CurrencyId7],
		E7.[EntryTypeId] AS [EntryTypeId7],
		E7.[MonetaryValue] AS [MonetaryValue7],
		E7.[Quantity] AS [Quantity7],
		E7.[UnitId] AS [UnitId7],
		E7.[Value] AS [Value7],
		E7.[Time1] AS [Time17],
		E7.[Duration] AS [Duration7],
		E7.[DurationUnitId] AS [DurationUnitId7],
		E7.[Time2] AS [Time27],
		E7.[ExternalReference] AS [ExternalReference7],
		E7.[ReferenceSourceId] AS [ReferenceSourceId7],
		E7.[InternalReference] AS [InternalReference7],
		E7.[NotedAgentName] AS [NotedAgentName7],
		E7.[NotedAmount] AS [NotedAmount7],
		E7.[NotedDate] AS [NotedDate7],
		E7.[NotedResourceId] AS [NotedResourceId7],

		E8.[Id] AS [Id8],
		E8.[Direction] AS [Direction8],
		E8.[AccountId] AS [AccountId8],
		E8.[AgentId] AS [AgentId8],
		E8.[NotedAgentId] AS [NotedAgentId8],
		E8.[ResourceId] AS [ResourceId8],
		E8.[CenterId] AS [CenterId8],
		E8.[CurrencyId] AS [CurrencyId8],
		E8.[EntryTypeId] AS [EntryTypeId8],
		E8.[MonetaryValue] AS [MonetaryValue8],
		E8.[Quantity] AS [Quantity8],
		E8.[UnitId] AS [UnitId8],
		E8.[Value] AS [Value8],
		E8.[Time1] AS [Time18],
		E8.[Duration] AS [Duration8],
		E8.[DurationUnitId] AS [DurationUnitId8],
		E8.[Time2] AS [Time28],
		E8.[ExternalReference] AS [ExternalReference8],
		E8.[ReferenceSourceId] AS [ReferenceSourceId8],
		E8.[InternalReference] AS [InternalReference8],
		E8.[NotedAgentName] AS [NotedAgentName8],
		E8.[NotedAmount] AS [NotedAmount8],
		E8.[NotedDate] AS [NotedDate8],
		E8.[NotedResourceId] AS [NotedResourceId8],

		E9.[Id] AS [Id9],
		E9.[Direction] AS [Direction9],
		E9.[AccountId] AS [AccountId9],
		E9.[AgentId] AS [AgentId9],
		E9.[NotedAgentId] AS [NotedAgentId9],
		E9.[ResourceId] AS [ResourceId9],
		E9.[CenterId] AS [CenterId9],
		E9.[CurrencyId] AS [CurrencyId9],
		E9.[EntryTypeId] AS [EntryTypeId9],
		E9.[MonetaryValue] AS [MonetaryValue9],
		E9.[Quantity] AS [Quantity9],
		E9.[UnitId] AS [UnitId9],
		E9.[Value] AS [Value9],
		E9.[Time1] AS [Time19],
		E9.[Duration] AS [Duration9],
		E9.[DurationUnitId] AS [DurationUnitId9],
		E9.[Time2] AS [Time29],
		E9.[ExternalReference] AS [ExternalReference9],
		E9.[ReferenceSourceId] AS [ReferenceSourceId9],
		E9.[InternalReference] AS [InternalReference9],
		E9.[NotedAgentName] AS [NotedAgentName9],
		E9.[NotedAmount] AS [NotedAmount9],
		E9.[NotedDate] AS [NotedDate9],
		E9.[NotedResourceId] AS [NotedResourceId9],

		E10.[Id] AS [Id10],
		E10.[Direction] AS [Direction10],
		E10.[AccountId] AS [AccountId10],
		E10.[AgentId] AS [AgentId10],
		E10.[NotedAgentId] AS [NotedAgentId10],
		E10.[ResourceId] AS [ResourceId10],
		E10.[CenterId] AS [CenterId10],
		E10.[CurrencyId] AS [CurrencyId10],
		E10.[EntryTypeId] AS [EntryTypeId10],
		E10.[MonetaryValue] AS [MonetaryValue10],
		E10.[Quantity] AS [Quantity10],
		E10.[UnitId] AS [UnitId10],
		E10.[Value] AS [Value10],
		E10.[Time1] AS [Time110],
		E10.[Duration] AS [Duration10],
		E10.[DurationUnitId] AS [DurationUnitId10],
		E10.[Time2] AS [Time210],
		E10.[ExternalReference] AS [ExternalReference10],
		E10.[ReferenceSourceId] AS [ReferenceSourceId10],
		E10.[InternalReference] AS [InternalReference10],
		E10.[NotedAgentName] AS [NotedAgentName10],
		E10.[NotedAmount] AS [NotedAmount10],
		E10.[NotedDate] AS [NotedDate10],
		E10.[NotedResourceId] AS [NotedResourceId10],

		E11.[Id] AS [Id11],
		E11.[Direction] AS [Direction11],
		E11.[AccountId] AS [AccountId11],
		E11.[AgentId] AS [AgentId11],
		E11.[NotedAgentId] AS [NotedAgentId11],
		E11.[ResourceId] AS [ResourceId11],
		E11.[CenterId] AS [CenterId11],
		E11.[CurrencyId] AS [CurrencyId11],
		E11.[EntryTypeId] AS [EntryTypeId11],
		E11.[MonetaryValue] AS [MonetaryValue11],
		E11.[Quantity] AS [Quantity11],
		E11.[UnitId] AS [UnitId11],
		E11.[Value] AS [Value11],
		E11.[Time1] AS [Time111],
		E11.[Duration] AS [Duration11],
		E11.[DurationUnitId] AS [DurationUnitId11],
		E11.[Time2] AS [Time211],
		E11.[ExternalReference] AS [ExternalReference11],
		E11.[ReferenceSourceId] AS [ReferenceSourceId11],
		E11.[InternalReference] AS [InternalReference11],
		E11.[NotedAgentName] AS [NotedAgentName11],
		E11.[NotedAmount] AS [NotedAmount11],
		E11.[NotedDate] AS [NotedDate11],
		E11.[NotedResourceId] AS [NotedResourceId11],

		E12.[Id] AS [Id12],
		E12.[Direction] AS [Direction12],
		E12.[AccountId] AS [AccountId12],
		E12.[AgentId] AS [AgentId12],
		E12.[NotedAgentId] AS [NotedAgentId12],
		E12.[ResourceId] AS [ResourceId12],
		E12.[CenterId] AS [CenterId12],
		E12.[CurrencyId] AS [CurrencyId12],
		E12.[EntryTypeId] AS [EntryTypeId12],
		E12.[MonetaryValue] AS [MonetaryValue12],
		E12.[Quantity] AS [Quantity12],
		E12.[UnitId] AS [UnitId12],
		E12.[Value] AS [Value12],
		E12.[Time1] AS [Time112],
		E12.[Duration] AS [Duration12],
		E12.[DurationUnitId] AS [DurationUnitId12],
		E12.[Time2] AS [Time212],
		E12.[ExternalReference] AS [ExternalReference12],
		E12.[ReferenceSourceId] AS [ReferenceSourceId12],
		E12.[InternalReference] AS [InternalReference12],
		E12.[NotedAgentName] AS [NotedAgentName12],
		E12.[NotedAmount] AS [NotedAmount12],
		E12.[NotedDate] AS [NotedDate12],
		E12.[NotedResourceId] AS [NotedResourceId12],

		E13.[Id] AS [Id13],
		E13.[Direction] AS [Direction13],
		E13.[AccountId] AS [AccountId13],
		E13.[AgentId] AS [AgentId13],
		E13.[NotedAgentId] AS [NotedAgentId13],
		E13.[ResourceId] AS [ResourceId13],
		E13.[CenterId] AS [CenterId13],
		E13.[CurrencyId] AS [CurrencyId13],
		E13.[EntryTypeId] AS [EntryTypeId13],
		E13.[MonetaryValue] AS [MonetaryValue13],
		E13.[Quantity] AS [Quantity13],
		E13.[UnitId] AS [UnitId13],
		E13.[Value] AS [Value13],
		E13.[Time1] AS [Time113],
		E13.[Duration] AS [Duration13],
		E13.[DurationUnitId] AS [DurationUnitId13],
		E13.[Time2] AS [Time213],
		E13.[ExternalReference] AS [ExternalReference13],
		E13.[ReferenceSourceId] AS [ReferenceSourceId13],
		E13.[InternalReference] AS [InternalReference13],
		E13.[NotedAgentName] AS [NotedAgentName13],
		E13.[NotedAmount] AS [NotedAmount13],
		E13.[NotedDate] AS [NotedDate13],
		E13.[NotedResourceId] AS [NotedResourceId13],

		E14.[Id] AS [Id14],
		E14.[Direction] AS [Direction14],
		E14.[AccountId] AS [AccountId14],
		E14.[AgentId] AS [AgentId14],
		E14.[NotedAgentId] AS [NotedAgentId14],
		E14.[ResourceId] AS [ResourceId14],
		E14.[CenterId] AS [CenterId14],
		E14.[CurrencyId] AS [CurrencyId14],
		E14.[EntryTypeId] AS [EntryTypeId14],
		E14.[MonetaryValue] AS [MonetaryValue14],
		E14.[Quantity] AS [Quantity14],
		E14.[UnitId] AS [UnitId14],
		E14.[Value] AS [Value14],
		E14.[Time1] AS [Time114],
		E14.[Duration] AS [Duration14],
		E14.[DurationUnitId] AS [DurationUnitId14],
		E14.[Time2] AS [Time214],
		E14.[ExternalReference] AS [ExternalReference14],
		E14.[ReferenceSourceId] AS [ReferenceSourceId14],
		E14.[InternalReference] AS [InternalReference14],
		E14.[NotedAgentName] AS [NotedAgentName14],
		E14.[NotedAmount] AS [NotedAmount14],
		E14.[NotedDate] AS [NotedDate14],
		E14.[NotedResourceId] AS [NotedResourceId14],

		E15.[Id] AS [Id15],
		E15.[Direction] AS [Direction15],
		E15.[AccountId] AS [AccountId15],
		E15.[AgentId] AS [AgentId15],
		E15.[NotedAgentId] AS [NotedAgentId15],
		E15.[ResourceId] AS [ResourceId15],
		E15.[CenterId] AS [CenterId15],
		E15.[CurrencyId] AS [CurrencyId15],
		E15.[EntryTypeId] AS [EntryTypeId15],
		E15.[MonetaryValue] AS [MonetaryValue15],
		E15.[Quantity] AS [Quantity15],
		E15.[UnitId] AS [UnitId15],
		E15.[Value] AS [Value15],
		E15.[Time1] AS [Time115],
		E15.[Duration] AS [Duration15],
		E15.[DurationUnitId] AS [DurationUnitId15],
		E15.[Time2] AS [Time215],
		E15.[ExternalReference] AS [ExternalReference15],
		E15.[ReferenceSourceId] AS [ReferenceSourceId15],
		E15.[InternalReference] AS [InternalReference15],
		E15.[NotedAgentName] AS [NotedAgentName15],
		E15.[NotedAmount] AS [NotedAmount15],
		E15.[NotedDate] AS [NotedDate],
		E15.[NotedResourceId] AS [NotedResourceId15]

	FROM @Lines L
	JOIN	  @Entries E0 ON L.[Index] = E0.[LineIndex] AND L.[DocumentIndex] = E0.[DocumentIndex] AND E0.[Index] = 0
	LEFT JOIN @Entries E1 ON L.[Index] = E1.[LineIndex] AND L.[DocumentIndex] = E1.[DocumentIndex] AND E1.[Index] = 1
	LEFT JOIN @Entries E2 ON L.[Index] = E2.[LineIndex] AND L.[DocumentIndex] = E2.[DocumentIndex] AND E2.[Index] = 2
	LEFT JOIN @Entries E3 ON L.[Index] = E3.[LineIndex] AND L.[DocumentIndex] = E3.[DocumentIndex] AND E3.[Index] = 3
	LEFT JOIN @Entries E4 ON L.[Index] = E4.[LineIndex] AND L.[DocumentIndex] = E4.[DocumentIndex] AND E4.[Index] = 4
	LEFT JOIN @Entries E5 ON L.[Index] = E5.[LineIndex] AND L.[DocumentIndex] = E5.[DocumentIndex] AND E5.[Index] = 5
	LEFT JOIN @Entries E6 ON L.[Index] = E6.[LineIndex] AND L.[DocumentIndex] = E6.[DocumentIndex] AND E6.[Index] = 6
	LEFT JOIN @Entries E7 ON L.[Index] = E7.[LineIndex] AND L.[DocumentIndex] = E7.[DocumentIndex] AND E7.[Index] = 7
	LEFT JOIN @Entries E8 ON L.[Index] = E8.[LineIndex] AND L.[DocumentIndex] = E8.[DocumentIndex] AND E8.[Index] = 8
	LEFT JOIN @Entries E9 ON L.[Index] = E9.[LineIndex] AND L.[DocumentIndex] = E9.[DocumentIndex] AND E9.[Index] = 9
	LEFT JOIN @Entries E10 ON L.[Index] = E10.[LineIndex] AND L.[DocumentIndex] = E10.[DocumentIndex] AND E10.[Index] = 10
	LEFT JOIN @Entries E11 ON L.[Index] = E11.[LineIndex] AND L.[DocumentIndex] = E11.[DocumentIndex] AND E11.[Index] = 11
	LEFT JOIN @Entries E12 ON L.[Index] = E12.[LineIndex] AND L.[DocumentIndex] = E12.[DocumentIndex] AND E12.[Index] = 12
	LEFT JOIN @Entries E13 ON L.[Index] = E13.[LineIndex] AND L.[DocumentIndex] = E13.[DocumentIndex] AND E13.[Index] = 13
	LEFT JOIN @Entries E14 ON L.[Index] = E14.[LineIndex] AND L.[DocumentIndex] = E14.[DocumentIndex] AND E14.[Index] = 14
	LEFT JOIN @Entries E15 ON L.[Index] = E15.[LineIndex] AND L.[DocumentIndex] = E15.[DocumentIndex] AND E15.[Index] = 15
)
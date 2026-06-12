using MediatR;
using Worklogr.Api.Features.Logs.GetToday;

namespace Worklogr.Api.Features.Logs.GetByDate;

public record GetByDateQuery(string Date) : IRequest<TodayResult>;

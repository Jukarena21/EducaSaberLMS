'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveClassData } from '@/types/liveClass';
import { formatDate } from '@/lib/utils';
import { 
  Video,
  Calendar,
  Clock,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Award,
  Users
} from 'lucide-react';

const PROVIDER_ICONS: Record<string, { name: string; color: string }> = {
  zoom: { name: 'Zoom', color: 'bg-blue-500' },
  meet: { name: 'Google Meet', color: 'bg-green-500' },
  teams: { name: 'Microsoft Teams', color: 'bg-purple-500' },
  webex: { name: 'Cisco Webex', color: 'bg-orange-500' },
  other: { name: 'Otro', color: 'bg-gray-500' },
};

interface LiveClassCardProps {
  liveClass: LiveClassData;
  onClick?: () => void;
  showFullDetails?: boolean;
}

export function LiveClassCard({ liveClass, onClick, showFullDetails = false }: LiveClassCardProps) {
  const startDate = new Date(liveClass.startDateTime);
  const endDate = liveClass.endDateTime ? new Date(liveClass.endDateTime) : null;
  const now = new Date();
  const isUpcoming = startDate > now;
  const isPast = startDate < now;
  const providerInfo = liveClass.provider ? PROVIDER_ICONS[liveClass.provider] : null;

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(liveClass.meetingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      className={`
        hover:shadow-lg transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${isPast ? 'opacity-75' : ''}
      `}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 flex-1">
            {liveClass.title}
          </CardTitle>
          {providerInfo && (
            <Badge className={`${providerInfo.color} text-white ml-2`}>
              {providerInfo.name}
            </Badge>
          )}
        </div>
        {liveClass.description && showFullDetails && (
          <p className="text-sm text-muted-foreground mt-2">
            {liveClass.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fecha y hora */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{formatDate(startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {startDate.toLocaleTimeString('es-CO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
              {endDate && (
                <> - {endDate.toLocaleTimeString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</>
              )}
            </span>
          </div>
        </div>

        {/* Contenido relacionado */}
        {(liveClass.competency || liveClass.module || liveClass.lesson) && (
          <div className="space-y-2">
            {liveClass.competency && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: liveClass.competency.colorHex || undefined 
                  }}
                  className="text-xs"
                >
                  <Award className="w-3 h-3 mr-1" />
                  {liveClass.competency.displayName || liveClass.competency.name}
                </Badge>
              </div>
            )}
            {liveClass.module && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span className="line-clamp-1">{liveClass.module.title}</span>
              </div>
            )}
            {liveClass.lesson && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="w-4 h-4" />
                <span className="line-clamp-1">{liveClass.lesson.title}</span>
              </div>
            )}
          </div>
        )}

        {/* Estado */}
        <div>
          {isPast ? (
            <Badge variant="secondary" className="text-xs">
              Finalizada
            </Badge>
          ) : isUpcoming ? (
            <Badge className="bg-green-500 text-white text-xs">
              Próxima
            </Badge>
          ) : (
            <Badge className="bg-blue-500 text-white text-xs">
              En curso
            </Badge>
          )}
        </div>

        {/* Botón de unirse */}
        {isUpcoming && (
          <Button 
            className="w-full bg-[#73A2D3] hover:bg-[#5a8bb8]"
            onClick={handleJoinClick}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Unirse a la Reunión
          </Button>
        )}

        {showFullDetails && (
          <>
            {/* Enlace */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Enlace de la reunión:</p>
              <a
                href={liveClass.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {liveClass.meetingUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Información adicional */}
            {liveClass.invitations && liveClass.invitations.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{liveClass.invitations.length} invitado{liveClass.invitations.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {liveClass.createdBy && (
              <div className="text-xs text-muted-foreground">
                Creada por: {liveClass.createdBy.firstName} {liveClass.createdBy.lastName}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

